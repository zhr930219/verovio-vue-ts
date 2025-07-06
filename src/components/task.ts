export default class IdleTaskQueue {
  tasks: Function[] = []
  taskHandle: number | null = null
  constructor() {
    this.tasks = []
    this.taskHandle = null
  }
  addTask(task: Function) {
    if (typeof task === 'function') {
      this.tasks.push(task)
      this.scheduleTasks()
    }
  }
  scheduleTasks() {
    if (this.tasks.length > 0 && !this.taskHandle) {
      this.taskHandle = requestIdleCallback(this.runTasks.bind(this))
    }
  }

  // 执行任务
  runTasks(deadline: IdleDeadline) {
    while (this.tasks.length > 0 && deadline.timeRemaining() > 0) {
      const task = this.tasks.shift()
      try {
        task && task()
      } catch (error) {
        console.error(error)
      }
    }

    if (this.tasks.length > 0) {
      this.taskHandle = requestIdleCallback(this.runTasks.bind(this))
    } else {
      this.taskHandle = null
    }
  }
  clearTasks() {
    this.tasks = []
    if (this.taskHandle !== null) {
      cancelIdleCallback(this.taskHandle)
      this.taskHandle = null
    }
  }
  hasPendingTasks() {
    return this.taskHandle !== null
  }
}