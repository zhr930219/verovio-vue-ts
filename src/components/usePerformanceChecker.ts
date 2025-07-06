import { ref, type Ref } from 'vue'

export const usePerformanceChecker = ({
  canvasRef
}: {
  canvasRef: Ref<HTMLCanvasElement | null>
}) => {
  const angle = ref(0)
  const requestAnimationFrameID = ref<number>(0)
  const draw = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    if (!ctx) return
    const squareSize = 30
    const x = (canvas.width - squareSize) / 2
    const y = (canvas.height - squareSize) / 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(x + squareSize / 2, y + squareSize / 2)
    ctx.rotate((angle.value * Math.PI) / 180)
    ctx.fillStyle = '#2c3e50'
    ctx.fillRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize)
    ctx.restore()
    angle.value = (angle.value + 2) % 360
    requestAnimationFrameID.value = requestAnimationFrame(draw)
  }
  const stop = () => {
    cancelAnimationFrame(requestAnimationFrameID.value)
  }
  return { draw, stop }
}

// export default usePerformanceChecker
