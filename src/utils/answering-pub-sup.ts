type Message = {
  answers: {
    questionOptionId: string,
    answersCount: number,
    percentage: number
  }[]
}

type Subscriber = (message: Message) => void

class AnsweringPubSub {
  private channels: Record<string, Subscriber[]> = {}

  subscribe(questionId: string, subscriber: Subscriber) {

    if (!this.channels[questionId]) {
      this.channels[questionId] = []
    }

    this.channels[questionId].push(subscriber)
  }

  publish(questionId: string, message: Message) {
    if (!this.channels[questionId]) {
      return;
    }

    for (const subscriber of this.channels[questionId]) {
      subscriber(message)
    }
  }
}

export const answering = new AnsweringPubSub()