import { Compass, Crosshair, Flag, Navigation, Volume2, VolumeX, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '@/components/Button/Button'
import CancelRouteDialog from '@/components/Schedule/CancelRouteDialog'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import NavigationVehicle from '@/components/Map/NavigationVehicle'
import RoutePolyline from '@/components/Map/RoutePolyline'
import { useCancelExecution, useFinishExecution } from '@/hooks/useExecutions'
import { useToast } from '@/hooks/useToast'
import { useNow } from '@/hooks/useNow'
import { useTravel } from '@/hooks/useTravel'
import { useWakeLock } from '@/hooks/useWakeLock'
import { formatClock } from '@/lib/format'
import { loadLeafletRotate } from '@/lib/leafletRotate'
import { toLatLng } from '@/lib/geo'
import {
  buildTimeline,
  buildTrack,
  describeDistance,
  describeDuration,
  hasArrived,
  nextStopIndex,
  remainingSeconds,
  secondsToNextStop,
  stopOffsets,
} from '@/lib/navigation'
import { routePath, secondsPerVertex } from '@/lib/routePath'
import {
  crossedSpokenThreshold,
  isVoiceSupported,
  phraseFor,
  SPOKEN_THRESHOLDS_M,
  speak,
  stopSpeaking,
} from '@/lib/voice'
import styles from '@/pages/ExecutionPage/NavigationView.module.css'
import { describeError } from '@/services/errors'
import type { Execution } from '@/services/schemas/execution'
import type { Route } from '@/services/schemas/route'

const SPEEDS = [1, 4, 10] as const
const ARRIVED_REMAINING_M = 20
const CLOCK_TICK_MS = 10_000

type NavigationViewProps = {
  execution: Execution
  route: Route
}

export default function NavigationView(props: NavigationViewProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    loadLeafletRotate()
      .catch(() => undefined)
      .then(() => {
        if (active) {
          setReady(true)
        }
      })
    return () => {
      active = false
    }
  }, [])

  return ready ? <NavigationMap {...props} /> : <div className={styles.stage} />
}

function NavigationMap({ execution, route }: NavigationViewProps) {
  const navigate = useNavigate()
  const { notify } = useToast()
  const finishExecution = useFinishExecution()
  const cancelExecution = useCancelExecution()
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(4)
  const [following, setFollowing] = useState(true)
  const [rotateMap, setRotateMap] = useState(true)
  const [voiceOn, setVoiceOn] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const spoken = useRef(new Map<number, Set<number>>())

  const stops = useMemo(
    () => [...route.points].sort((first, second) => first.visitOrder - second.visitOrder),
    [route.points],
  )
  const track = useMemo(() => buildTrack(routePath(route)), [route])
  const timeline = useMemo(() => buildTimeline(track, secondsPerVertex(route)), [track, route])
  const visits = useMemo(() => stops.slice(1), [stops])
  const offsets = useMemo(() => stopOffsets(track, visits.map(toLatLng)), [track, visits])
  const travel = useTravel(track, speed)
  useWakeLock(true)
  const now = useNow(CLOCK_TICK_MS)

  const nextIndex = nextStopIndex(offsets, travel.along)
  const nextStop = visits[nextIndex]
  const nextOffset = offsets[nextIndex]
  const lastStop = visits[visits.length - 1]
  const remainingMeters = Math.max(0, track.total - travel.along)
  const remainingStops = Math.max(0, visits.length - nextIndex)
  const arrived =
    travel.position !== null &&
    (hasArrived(travel.position, lastStop ? toLatLng(lastStop) : undefined) ||
      remainingMeters <= ARRIVED_REMAINING_M)
  const tone = route.criterion === 'EMISSION' ? 'emission' : 'distance'
  const remainingTime = remainingSeconds(timeline, travel.along, remainingStops)
  const toNext = nextOffset === undefined ? 0 : secondsToNextStop(timeline, travel.along, nextOffset)
  const arrivalClock = formatClock(new Date(now.getTime() + remainingTime * 1000))

  const handleUserMoved = useCallback(() => setFollowing(false), [])

  useEffect(() => {
    if (!voiceOn || !nextStop || nextOffset === undefined) {
      return
    }
    const already = spoken.current.get(nextIndex) ?? new Set<number>()
    const threshold = crossedSpokenThreshold(nextOffset - travel.along, already)
    if (threshold === null) {
      return
    }
    spoken.current.set(
      nextIndex,
      new Set([...already, ...SPOKEN_THRESHOLDS_M.filter((limit) => limit >= threshold)]),
    )
    speak(phraseFor(threshold, nextStop.name))
  }, [voiceOn, nextStop, nextOffset, nextIndex, travel.along])

  useEffect(() => stopSpeaking, [])

  const finish = () =>
    finishExecution.mutate(execution.id, {
      onSuccess: () => {
        notify('Rota finalizada.', 'success')
        navigate('/')
      },
      onError: (error) => notify(describeError(error), 'danger'),
    })

  const cancel = (reason: string) =>
    cancelExecution.mutate({ id: execution.id, reason }, {
      onSuccess: () => {
        notify('Rota cancelada.', 'info')
        navigate('/')
      },
      onError: (error) => notify(describeError(error), 'danger'),
    })

  const banner = (() => {
    if (travel.position === null) {
      return travel.mode === 'gps' ? 'Aguardando o sinal de GPS…' : 'Preparando o percurso simulado…'
    }
    if (arrived) {
      return 'Você chegou ao destino final'
    }
    const distance = describeDistance(Math.max(0, (nextOffset ?? 0) - travel.along))
    return `Em ${distance}: ${nextStop?.name ?? ''}`
  })()

  return (
    <div className={styles.stage}>
      <MapView
        label="Mapa de navegação"
        flush
        rotatable
        fitTo={travel.position ? undefined : track.points}
        zoomPosition="bottomleft"
      >
        <RoutePolyline tone={tone} positions={track.points} />
        {stops.map((stop, index) => (
          <MapMarker
            key={stop.pointId}
            position={toLatLng(stop)}
            title={stop.name}
            label={index === 0 ? 'S' : String(index)}
            tone={tone}
            selected={index === nextIndex + 1}
          />
        ))}
        <NavigationVehicle
          position={travel.position}
          heading={travel.heading}
          following={following}
          rotateMap={rotateMap}
          onUserMoved={handleUserMoved}
        />
      </MapView>

      <div className={styles.banner} role="status" aria-live="polite">
        <Navigation size={20} aria-hidden="true" />
        <span>{banner}</span>
      </div>

      {travel.gpsProblem && (
        <p role="alert" className={styles.problem}>
          {travel.gpsProblem}
        </p>
      )}

      <div className={styles.bar}>
        <dl className={styles.facts}>
          <div>
            <dt>Restante</dt>
            <dd>{describeDistance(remainingMeters)}</dd>
          </div>
          <div>
            <dt>Tempo restante</dt>
            <dd>{describeDuration(remainingTime)}</dd>
          </div>
          <div>
            <dt>Chegada prevista</dt>
            <dd>{arrivalClock}</dd>
          </div>
          <div>
            <dt>Próxima parada</dt>
            <dd>{nextStop ? describeDuration(toNext) : '—'}</dd>
          </div>
          <div>
            <dt>Paradas</dt>
            <dd>{remainingStops}</dd>
          </div>
        </dl>
        <div className={styles.controls}>
          <Button
            size="sm"
            variant={travel.mode === 'simulated' ? 'primary' : 'secondary'}
            aria-pressed={travel.mode === 'simulated'}
            onClick={() => travel.changeMode(travel.mode === 'simulated' ? 'gps' : 'simulated')}
          >
            Simular percurso
          </Button>
          {travel.mode === 'simulated' && (
            <div role="group" aria-label="Velocidade da simulação" className={styles.speeds}>
              {SPEEDS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={speed === option ? 'primary' : 'ghost'}
                  aria-pressed={speed === option}
                  onClick={() => setSpeed(option)}
                >
                  {option}x
                </Button>
              ))}
            </div>
          )}
          <Button
            size="sm"
            variant={rotateMap ? 'secondary' : 'ghost'}
            aria-pressed={rotateMap}
            onClick={() => setRotateMap((current) => !current)}
          >
            <Compass size={16} aria-hidden="true" />
            Mapa girando
          </Button>
          {isVoiceSupported() && (
            <Button
              size="sm"
              variant={voiceOn ? 'secondary' : 'ghost'}
              aria-pressed={voiceOn}
              onClick={() => {
                if (voiceOn) {
                  stopSpeaking()
                }
                setVoiceOn((current) => !current)
              }}
            >
              {voiceOn ? (
                <Volume2 size={16} aria-hidden="true" />
              ) : (
                <VolumeX size={16} aria-hidden="true" />
              )}
              Aviso por voz
            </Button>
          )}
          {!following && (
            <Button size="sm" variant="secondary" onClick={() => setFollowing(true)}>
              <Crosshair size={16} aria-hidden="true" />
              Recentralizar
            </Button>
          )}
        </div>
        <div className={styles.finish}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingCancel(true)}
            aria-label="Cancelar rota"
          >
            <X size={16} aria-hidden="true" />
            Cancelar
          </Button>
          {arrived && (
            <Button loading={finishExecution.isPending} onClick={finish}>
              <Flag size={16} aria-hidden="true" />
              Finalizar rota
            </Button>
          )}
        </div>
      </div>

      <CancelRouteDialog
        open={confirmingCancel}
        title="Cancelar a rota"
        confirmLabel="Cancelar rota"
        loading={cancelExecution.isPending}
        onConfirm={cancel}
        onBack={() => setConfirmingCancel(false)}
      />
    </div>
  )
}
