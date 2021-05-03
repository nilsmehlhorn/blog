---
path: '/posts/react-hooks-rxjs'
date: '2021-05-04'
title: 'React Hooks Are Not Reactive Programming'
published: true
tags: ['web development', 'react', 'frontend']
banner: './react-rxjs-pagination-banner.jpg'
description: "Here's why React Hooks are not reactive programming and how you can use RxJS knowledge from Angular in React"
---

I've increasingly started working with React which is a nice change of scenery. I've had to learn quite a few things about the framework while I was able to re-use basic web development skills (HTML, (S)CSS, JavaScript/TypeScript) and transfer concepts like component-orientation. Glancing at React hooks I also hoped to profit off of my experience with reactive programming - but that didn't really turn out to be the case and here's why.

Using Angular made me learn RxJS and its underlying concept of observables. The nice thing here is that RxJS and reactive programming in general is fundamentally decoupled from any framework - it's a generic paradigm that you can apply in all sorts of domains where you're dealing with asynchronous problems.

> RxJS is a library for composing asynchronous and event-based programs by using observable sequences. It provides one core type, the Observable, satellite types (Observer, Schedulers, Subjects) and operators inspired by Array#extras (map, filter, reduce, every, etc) to allow handling asynchronous events as collections. -- [RxJS Docs](https://rxjs.dev/guide/overview)

In fact, RxJS is one implementation of the [ReactiveX](http://reactivex.io/) API which is also available for numerous [other languages](http://reactivex.io/languages.html). However, ideas from reactive programming aren't limited to that project but can now be found in many places and practically any modern user-interface framework\*.

- [Vue.js has an observable implementation](https://vuejs.org/v2/api/#Vue-observable) used for change detection and state management
- [Angular leverages RxJS observables](https://angular.io/guide/observables-in-angular) for component communication, HTTP requests and providing event listeners on forms or the router
- React, well, it has it in the name, ain't it?

Actually, kind of yes and also kind of no for that last one. The name definitely relates to reactivity in the sense that React _reacts_ to changes of a component's state by scheduling an update of the corresponding view. Apart from that, the framework is explicitly not concerned with reactive programming.

> There is an internal joke in the team that React should have been called “Schedule” because React does not want to be fully “reactive” -- [React Docs, Design Principles](https://reactjs.org/docs/design-principles.html)

It might seem like that has changed with the introduction of function components and specifically [hooks](https://reactjs.org/docs/hooks-intro.html). Let's see how they compare to RxJS observables by looking at an example where we encapsulate an HTTP request made with the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

We'll start with the RxJS version where we can create a custom observable with the [`Observable`](https://rxjs.dev/api/index/class/Observable) constructor. It accepts a callback (or subscribe function) which will be executed upon [subscription](https://rxjs.dev/guide/subscription). This callback receives a `subscriber` to whom we can subsequently emit values via [`subscriber.next()`](https://rxjs.dev/api/index/class/Subscriber#next) as well as signalize completion or failure of the underlying operation via [`subscriber.complete()`](https://rxjs.dev/api/index/class/Subscriber#complete) and [`subscriber.error()`](https://rxjs.dev/api/index/class/Subscriber#error) respectively. A subscribe function can optionally return another callback (teardown logic) that'll be invoked when the observable is unsubscribed. This allows us to implement cancellation.

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

In our concrete case, we'll first use the Promise-based Fetch API to executed and parse the HTTP request before emitting the response to the subscriber and immediately completing the observable. When the request should fail, the subscriber will also be notified. We'll additionally have teardown logic levering an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#aborting_a_fetch) to cancel the HTTP request.

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

For good measure, [here's a demo](https://stackblitz.com/edit/angular-fetch-rxjs?file=src/app/app.component.ts) of how you'd use it in Angular. Note that you'll probably rather want to use [`fromFetch`](https://rxjs.dev/api/fetch/fromFetch), [`ajax`](https://rxjs.dev/api/ajax/ajax) or Angular's HttpClient in practice.

Now, let's see how we'd implement a similar HTTP client within a [custom React hook](https://reactjs.org/docs/hooks-custom.html). First off, we'd probably rename the encapsulating function so that it contains the "use" prefix to comply with the [rules of hooks](https://reactjs.org/docs/hooks-rules.html).

Then we create a functional state variable with [`useState`](https://reactjs.org/docs/hooks-reference.html#usestate) for holding a the response from our HTTP request. Our hook will always return the most recent states of both variables as a tuple - both starting off with as undefined.

The next built-in hook that we'll leverage is [`useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect) which can be used similar to the Observable constructor: pass a callback where we kick off an HTTP request, parse the response and update the state - we can even return a teardown function. The second parameter is an optional list of values that will be watched by React. When one of the values changes, the effect will be run again. Passing an empty list makes sure that our effect runs only once when a component which uses the hook is created. In turn, when you pass no list at all the effect will run every time the component is re-rendered.

```ts
import { useState, useEffect } from 'react'

const useUsers = () => {
  const [users, setUsers] = useState()
  const [error, setError] = useState()
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

And here's how we'd use our custom hook inside a React component ([live demo](https://stackblitz.com/edit/react-ts-nycsw7?file=index.tsx)):

```tsx
import React from 'react'

const Users = () => {
  const [error, users] = useUsers()
  if (!users) {
    return <p>Starting request ...</p>
  }
  if (error) {
    return <p>There has been an error: {error.message}</p>
  }
  return <p>Received {users.length} users</p>
}
```

Looks all very similar, doesn't it? Coming from Angular you'd think the latter is just the React way of doing reactive programming - but it's not. It's the React way of scheduling view updates and we're leveraging it to encapsulate asynchronous logic.

> I wonder how many people realize that React Hooks is really just disconnected, less declarative reactive programming. -- [Ben Lesh, RxJS Team Lead](https://twitter.com/BenLesh/status/1374755992378953730)

Ben has made some great points comparing React hooks and observables [here](https://twitter.com/BenLesh/status/1118888489108422656).

The point that I want to get across the most: hooks are React, reactivity is universal. You can easily get this from the fact that `getUsers()` from our example can be used with and without Angular while `useUsers()` only make sense when used inside a React component. Eventually, the "reactivity" of React hooks is opaque and hard-wired to the framework. It's not evident from the type of a hooked variable that it may change (e.g. `number` vs. `Observable<number>`). Hooks also don't really have an API surface. Instead they rely on the way you order your calls and how React schedules view updates. Those are also the reasons why you should do things like prefixing custom hooks with "use" - whether that rolls off the tongue or not.

Hooks are a fascinating piece of work that highlights the power of functional programming, specifically closures. I'd recommend you read the well-written article [Deep dive: How do React hooks really work?](https://www.netlify.com/blog/2019/03/11/deep-dive-how-do-react-hooks-really-work/) by [swyx](https://twitter.com/swyx) to see this for yourself. The thing to keep in mind is that hooks are first and foremost focused on component rendering. They're not primarily meant for orchestrating asynchronous, possibly long-living event streams - also known as reactive programming.

Fortunately, RxJS and React hooks don't exclude each other. We can make them get along via a custom hook that takes an observable, subscribes to it and forwards events into hooked state variables:

```ts
export const useObservable = (observable) => {
  const [value, setValue] = useState()
  const [error, setError] = useState()

  useEffect(() => {
    const subscription = observable.subscribe(setValue, setError)
    return () => subscription.unsubscribe()
  }, [observable])

  return [error, value]
}
```

Once we have this little reactive helper we can replace our custom `useUsers()` hook with the existing RxJS-based HTTP client ([live demo](https://stackblitz.com/edit/react-fetch-rxjs-hook)):

```tsx
import React from 'react'

const Users = () => {
  const [error, users] = useObservable(getUsers())
  if (!users) {
    return <p>Starting request ...</p>
  }
  if (error) {
    return <p>There has been an error: {error.message}</p>
  }
  return <p>Received {users.length} users</p>
}
```

Essentially, such a hook is similar to Angular's [AsyncPipe](https://angular.io/api/common/AsyncPipe) or a [similar structural directive](https://nils-mehlhorn.de/posts/angular-observable-directive). It's a bridge for synchronizing reactive code with a framework's change detection mechanism.

Again, in practice you could use a more battle-tested solution like one of the following:

- https://github.com/streamich/react-use
- https://github.com/LeetCode-OpenSource/rxjs-hooks
- https://github.com/crimx/observable-hooks

Now, don't get me wrong, using hooks for asynchronous code is fine in many cases. After all, observables are probably not the most convenient [abstraction for asynchronous operations that produce a single value](https://twitter.com/BenLesh/status/1385252078788825088) like HTTP requests. I won't argue that you should outsource all logic via RxJS - especially if it's not asynchronous. Rather, I want you to understand the trade-offs between coupling logic to the change detection mechanism of your chosen view framework. More importantly, I want to show the strength of Observable as a universal abstraction which will allow you to write portable and framework-independent code for working with asynchronous event collections.

Here's another example for this: in a previous post I've developed a [pagination data source for Angular](https://nils-mehlhorn.de/posts/angular-material-pagination-datasource) with RxJS. This data source is basically an abstraction of a paginated REST endpoint offering an observable stream of a page and methods for fetching the next page as well as sorting and filtering by one-off queries.

Apart from the explicit implementation of a TypeScript interface there's not a single reference to the Angular framework in the data source. That way, we can re-use it in a React project without changing the actual implementation one bit. A paginated table component for displaying users could then look as follows:

```ts
import React, { useRef } from 'react'
import { useObservable } from 'react-use'
import { Sort, SortOrder } from '../lib/page'
import { Pagination } from '../lib/pagination'
import { getUsersPage, User, UserQuery } from '../lib/users'

const initialSort: Sort<User> = { property: 'id', order: 'asc' }
const initialQuery: UserQuery = { search: '', registrationDate: undefined }
const pageSize = 5

export const Table: React.FC = () => {
  const { current: pagination } = useRef(
    new Pagination<User, UserQuery>(
      getUsersPage,
      initialSort,
      initialQuery,
      pageSize
    )
  )
  const page = useObservable(pagination.page$)

  const onQuerySearchChange = ({
    target,
  }: React.ChangeEvent<HTMLInputElement>) => {
    pagination.queryBy({ search: target.value })
  }

  const onNextPage = () => pagination.fetch(page.number + 1)

  const onPreviousPage = () => pagination.fetch(page.number - 1)

  /* more event handlers */

  return /* table JSX */
}
```

Here's a live demo of this (also, [code on GitHub](https://github.com/nilsmehlhorn/react-rxjs-pagination-example)):

<iframe src="https://codesandbox.io/embed/react-rxjs-pagination-example-c0vw9?fontsize=14&hidenavigation=1&module=%2Fsrc%2Fcomponents%2FTable.tsx&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="fancy-sunset-c0vw9"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

<small>\* there might be differences between the terms "framework" and "library" but I'll just call everything framework here</small>
