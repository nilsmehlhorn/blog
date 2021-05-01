---
path: '/posts/react-rxjs-pagination'
date: '2021-04-27'
title: 'React Hooks Are Not Reactive Programming'
published: true
tags: ['web development', 'react', 'frontend']
banner: './react-rxjs-pagination-banner.jpg'
description: 'Build a reusable pagination with React an RxJS for filtering and sorting dynamic data'
---

In a previous post I've developed a [pagination data source for Angular](https://nils-mehlhorn.de/posts/angular-material-pagination-datasource) with RxJS. Now recently I've started working with React which is a nice change of scenery. I've had to learn quite a few things about the framework. -- other things I could transfer (lead to reactivity)

Using Angular made me learn RxJS and its underlying reactive concepts of observables. The nice thing here is that RxJS and reactive programming in general is fundamentally decoupled from any framework - it's a generic paradigm that you can apply in all sorts of domains where you're dealing with asynchronous problems.

> RxJS is a library for composing asynchronous and event-based programs by using observable sequences. It provides one core type, the Observable, satellite types (Observer, Schedulers, Subjects) and operators inspired by Array#extras (map, filter, reduce, every, etc) to allow handling asynchronous events as collections. -- [RxJS Docs](https://rxjs.dev/guide/overview)

In fact, RxJS is one implementation of the [ReactiveX](http://reactivex.io/) API which is also available for numerous [other languages](http://reactivex.io/languages.html). However, ideas from reactive programming aren't limited to that project but can now be found in many places and practically any modern user-interface framework\*.

- [Vue.js has an observable implementation](https://vuejs.org/v2/api/#Vue-observable) used for change detection and state management
- [Angular leverages RxJS observables](https://angular.io/guide/observables-in-angular) for component communication, HTTP requests and providing event listeners on forms or the router
- React, well, it has it in the name, ain't it?

Actually, kind of yes and also kind of no for that last one. The name definitely relates to reactivity in the sense that React _reacts_ to changes of a component's state by scheduling an update of the corresponding view. Apart from that, the framework is explicitly not concerned with reactive programming.

> There is an internal joke in the team that React should have been called “Schedule” because React does not want to be fully “reactive” -- [React Docs, Design Principles](https://reactjs.org/docs/design-principles.html)

It might seem like that has changed with the introduction of function components and specifically [hooks](https://reactjs.org/docs/hooks-intro.html).

Take a look at the following example where I'm encapsulating an HTTP request made with the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) into an observable.

The callback (or subscribe function) passed to the [`Observable`](https://rxjs.dev/api/index/class/Observable) constructor will be executed upon [subscription](https://rxjs.dev/guide/subscription). This callback receives a `subscriber` to whom we can then emit observable values via [`subscriber.next()`](https://rxjs.dev/api/index/class/Subscriber#next) as well as signalize completion or failure of the underlying operation via [`subscriber.complete()`](https://rxjs.dev/api/index/class/Subscriber#complete) and [`subscriber.error()`](https://rxjs.dev/api/index/class/Subscriber#error) respectively. A subscribe function can optionally return another callback (teardown logic) that'll be invoked when the observable is unsubscribed. This allows us to implement cancellation.

In our concrete case, we'll first use the Promise-based Fetch API to executed and parse the HTTP request before emitting the response to the subscriber and immediately completing the observable. When the request should fail, the subscriber will also be notified. We'll additionally have teardown logic levering an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#aborting_a_fetch) to cancel an HTTP request.

```ts
import { Observable } from 'rxjs'

const getUsers = () => {
  return new Observable((subscriber) => {
    const controller = new AbortController()
    const { signal } = controller
    fetch('/api/users', { signal })
      .then((response) => response.json())
      .then((usersFromApi) => {
        subscriber.next(usersFromApi)
        subscriber.complete()
      })
      .catch((apiError) => subscriber.error(apiError))
    return () => controller.abort()
  })
}
```

Here's how we could use our little RxJS HTTP client:

```ts
console.log('Starting request ...')
const subscription = getUsers().subscribe(
  // onNext callback
  (users) => {
    console.log(`Received ${users.length} users`)
  },
  // onError callback
  (error) => {
    console.error('There has been an error', error)
  },
  // onComplete callback
  () => {
    console.log('Request finished')
  }
)
```

Now, let's see how we'd implement a similar HTTP client within a custom React hook. First off, we'd probably rename the encapsulating function so that it contains the "use" prefix to comply with the [rules of hooks](https://reactjs.org/docs/hooks-rules.html).

Then we create a functional state variable with [`useState`](https://reactjs.org/docs/hooks-reference.html#usestate) for holding a the response from our HTTP request. Our hook will always return the most recent states of both variables as a tuple - both starting off with as undefined.

[[info]]
| Recommended Read: [Deep dive: How do React hooks really work?](https://www.netlify.com/blog/2019/03/11/deep-dive-how-do-react-hooks-really-work/) by [swyx](https://twitter.com/swyx)

The next hook that we'll leverage ist [`useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect) and it looks pretty similar to our Observable implementation: we kick off an HTTP request, parse the response and update the state - we can even return a teardown function.

```ts
import { useState, useEffect } from 'react'

const useUsers = () => {
  const [users, setUsers] = useState(undefined)
  const [error, setError] = useState(undefined)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    fetch('/api/users', { signal })
      .then((response) => response.json())
      .then((usersFromApi) => setUsers(userFromApi))
      .catch((apiError) => setError(apiError))
    return () => controller.abort()
  }, [])
  return [error, users]
}
```

And here's how we'd use our custom hook inside a React component:

```tsx
import React from 'react'

const Users = () => {
  const [error, users] = useUsers()
  if (!users) {
    return <p>Starting request ...</p>
  }
  if (error) {
    return <p>There has been an error: {error}</p>
  }
  return <p>Received {users.length} users</p>
}
```

Looks all very similar, doesn't it? Coming from Angular you'd think the latter is just the React way of doing reactive programming - but it's not. It's the React way of scheduling view updates and we're levering it to encapsulate asynchronous stateful logic.

<small>\* there might be differences between the terms "framework" and "library" but I'll just call everything framework here</small>

https://twitter.com/BenLesh/status/1374755992378953730
https://twitter.com/BenLesh/status/1118888489108422656
