import { Crosshair, Flag, Navigation, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '@/components/Button/Button'
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog'
import FollowPosition from '@/components/Map/FollowPosition'
import LocationArrow from '@/components/Map/LocationArrow'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import RoutePolyline from '@/components/Map/RoutePolyline'
import { useCancelExecution, useFinishExecution } from '@/hooks/useExecutions'
import { useToast } from '@/hooks/useToast'
import { useTravel } from '@/hooks/useTravel'
import { toLatLng } from '@/lib/geo'
import { buildTrack, describeDistance, nextStopIndex, stopOffsets } from '@/lib/navigation'
import { routePath } from '@/lib/routePath'
import styles from '@/pages/ExecutionPage/NavigationView.module.css'
import { describeError } from '@/services/errors'
import type { Execution } from '@/services/schemas/execution'
import type { Route } from '@/services/schemas/route'

const SPEEDS = [1, 4, 10] as const

type NavigationViewProps = {
  execution: Execution
  route: Route
}

export default function NavigationView({ execution, route }: NavigationViewProps) {
  const navigate = useNavigate()
  const { notify } = useToast()
  const finishExecution = useFinishExecution()
  const cancelExecution = useCancelExecution()
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(4)
  const [following, setFollowing] = useState(true)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const stops = useMemo(
    () => [...route.points].sort((first, second) => first.visitOrder - second.visitOrder),
    [route.points],
  )
  const track = useMemo(() => buildTrack(routePath(route)), [route])
  const visits = useMemo(() => stops.slice(1), [stops])
  const offsets = useMemo(() => stopOffsets(track, visits.map(toLatLng)), [track, visits])
  const travel = useTravel(track, speed)

  const nextIndex = nextStopIndex(offsets, travel.along)
  const nextStop = visits[nextIndex]
  const nextOffset = offsets[nextIndex]
  const remainingMeters = Math.max(0, track.total - travel.along)
  const arrived = nextStop === undefined && travel.position !== null
  const tone = route.criterion === 'EMISSION' ? 'emission' : 'distance'

  const handleUserMoved = useCallback(() => setFollowing(false), [])

  const finish = () =>
    finishExecution.mutate(execution.id, {
      onSuccess: () => {
        notify('Rota finalizada.', 'success')
        navigate('/')
      },
      onError: (error) => notify(describeError(error), 'danger'),
    })

  const cancel = () =>
    cancelExecution.mutate(execution.id, {
      onSuccess: () => {
        notify('Rota cancelada.', 'info')
        navigate('/')
      },
      onError: (error) => notify(describeError(error), 'danger'),
    })

  const banner = (() => {
    if (travel.position === null) {
      return travel.mode === 'gps'
        ? 'Aguardando o sinal de GPS…'
        : 'Preparando o percurso simulado…'
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
        {travel.position && <LocationArrow position={travel.position} heading={travel.heading} />}
        <FollowPosition
          position={travel.position}
          following={following}
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
            <dt>Paradas</dt>
            <dd>{Math.max(0, visits.length - nextIndex)}</dd>
          </div>
          <div>
            <dt>Velocidade</dt>
            <dd>{Math.round(travel.speedKmh)} km/h</dd>
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
          <Button
            variant={arrived || travel.finished ? 'primary' : 'secondary'}
            loading={finishExecution.isPending}
            onClick={finish}
          >
            <Flag size={16} aria-hidden="true" />
            Finalizar rota
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancelar a rota"
        description="A rota em andamento será cancelada. Você poderá calcular uma nova depois."
        confirmLabel="Cancelar rota"
        tone="danger"
        loading={cancelExecution.isPending}
        onConfirm={cancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </div>
  )
}
