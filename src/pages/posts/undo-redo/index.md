---
path: "/posts/angular-undo-redo-ngrx-redux"
date: "2019-06-20"
title: "Implementing Undo-Redo with NgRx or Redux"
published: true
tags: ["web development", "frontend", "angular"]
keywords: ["ngrx", "redux", "undo", "redo", "ui", "ux", "angularjs", "rxjs", "typescript", "pattern", "immer"]
---

Having the ability to undo your actions has long moved from being an
[attractive product quality](https://en.wikipedia.org/wiki/Kano_model)
towards a must-be one. People just expect this type of fault tolerance
from any reasonably complex tool. Yet, as often in software development,
growing user expectations can be surprisingly far from ease of their
fulfillment. In this post we'll be looking at how you might go about
pulling off undo-redo in your next Angular app.

<img src="undo-redo.png" alt="undo-redo-feature-concept" title="Undo & redo allow you to traverse an application's state history parallel from the main application flow"/>

At its core, the general undo-redo feature can be described as the
ability to go back to previous application states, and once there, in
turn, go forward to then future states. Sounds easy right? It's so
inherit to most people's workflow that you take it for granted. Yet,
when its your turn to put the logic behind `Ctrl+Z` and `Ctrl+Y` you
might be in for a surprise: there isn't - and there probably can't be -
a pluggable solution if you didn't plan ahead.

Talking about application state in web applications the Redux pattern
quickly comes to mind. Redux provides a good foundation through its
[three principles](https://redux.js.org/introduction/three-principles):

**1. Single source of truth:** By having the whole application state in
one place - the store - we can get a good grip on past, present and
future states.

**2. State is read-only:** We don't have to worry about states being
corrupted.

**3. Changes are made with pure functions:** State is mutated
in a deterministic way and we can easily replace the whole state.

You'll quickly end up at
[Redux](https://redux.js.org/) - and it's Angular counterpart
[NgRx](https://ngrx.io/) - when searching for ways to enable undo-redo
in your app. It's a good way to plan ahead, yet, as we're about to see,
it may not fulfill all your needs out-of-the-box.

In order to have a pluggable solution, undo-redo is probably best
implemented as a
[middleware](https://redux.js.org/advanced/middleware) or
[meta-reducer](https://ngrx.io/guide/store/metareducers) respectively
for Redux or NgRx. So lets have a look at three different approaches for
doing just that.

## Switching states

For a working undo-redo feature we want to restore past and futures
states. With NgRx and Redux, the straightforward solution seems to be
the memorization of what has been in the application's store. The data
structure for this approach could look like this:

```typescript
interface History {
  past: Array<State>
  present: State
  future: Array<State>
}
```

The feature would be implemented analogous to what we want to achieve.
We'd continuously save states to the past stack upon user interaction
and replace the present upon dispatch of an undo action. When this
happens we save the present state to the future stack in order to apply
it again upon dispatch of a redo action. Our middleware or meta-reducer
could handle undo and redo actions as follows:

```typescript
const undoRedo = (reducer) => {
  let history = {
    past: [], 
    present: initialState, 
    future: []
  }
  return (state, action) => {
      switch (action.type) {
        case 'UNDO':
          // use first past state as next present ...
          const previous = history.past[0]
          // ... and remove from past
          const newPast = history.past.slice(1)
          history = {
            past: newPast,
            present: previous,
            // push present into future for redo
            future: [history.present, ...history.future]
          }
          return previous
        case 'REDO':
          // use first future state as next present ...
          const next = history.future[0]
          // ... and remove from future
          const newFuture = history.future.slice(1)
          history = {
            // push present into past for undo
            past: [history.present, ...history.past],
            present: next,
            future: newFuture
          }
          return next
        default:
          // derive next state
          const newPresent = reducer(state, action)
          history = {
              // push previous present into past for undo
              past: [history.present, ...history.past],
              present: newPresent,
              future: [] // clear future
          }
          return newPresent
      }
  }
}
```

The approach resembles the
[memento pattern](https://en.wikipedia.org/wiki/Memento_pattern) - a
common tool for implementing undo-redo. While it definitely works, it
has certain flaws:

**It can get big.** You're basically multiplying your application's
state. Depending on the scope you'd like to apply undo-redo to, this
will eventually use up far more memory than actually necessary. Most of
the times one transition will only change a rather small part of your
state. Recording every single bit of state is just inefficient.
   
**It's all or nothing.** You can't limit undo-redo to certain actions.
Suppose you start at state S1 and move to state S2 through an undoable
user interaction. Next you move from state S2 to S3 through some action
you don't want to be undoable. If you'd now go back to state S1 upon
undo you'd lose the changes introduced in the transition from S2 to S3.
You might overcome this
[issue](https://github.com/omnidan/redux-undo/issues/106) through
careful reducer composition which can be bit hard to achieve sometimes
though.

<img src="all-or-nothing.png" alt="all-or-nothing-problem" title="When only A1 is an undoable action, you'll loose the green circle introduced by A2"/>

Despite these trade-offs, the
[endorsed library](https://github.com/omnidan/redux-undo/) for
implementing undo-redo with the main Redux library is
[using this
approach](https://redux.js.org/recipes/implementing-undo-history).
There's nothing as big for NgRx yet some smaller ones are using the
approach as well.

## Repeating history

Reducers are just pure functions. Calculating the next state based on a
dispatched action can be repeated deterministically at any time with the
same result. Have a look at the illustration below. Action A1 changes
our state S1 to S2. Equally, actions A2 and A3 transition to S3 and S4.
Having saved the base state S1 and all intermediate actions, we'd be
able to return to S3 when recalculating it by applying A1 and A2 to S1.

<img src="state-recalculation.png" alt="state-recalculation-concept" title="Using actions to calculate the last state effectively replays the application's history"/>

Therefore, in order to enable undo, we could also keep track of any
dispatched action, replay them all except for the last one and we'd be
one step into the past. Just looking at the undo part, a corresponding
data structure could look like follows, where we'd push applied actions
to a list and have a saved base state we'd use for recalculation.

```typescript
interface History {
  actions: Array<Action> // actions since base
  base: State // base state representing the furthest point we can go back
}
```

Calculation of the last state could then look something like this:

```typescript
const lastState = () => history.actions
    .slice(0, -1) // every action except the last one
    .reduce((state, action) => reducer(state, action), history.base)
```

Redux resembles the
[command pattern](https://en.wikipedia.org/wiki/Command_pattern) with
it's actions serving as the commands. As a result, this approach to
undo-redo acts as some kind of _replay command pattern_.

Again, the approach works and there are libraries for Redux and NgRx,
respectively. It can even be more lightweight as actions are generally
less heavy than your whole application state. Yet, depending on your
reducer logic, it **may be expensive** to recalculate the state
recursively from the start just to know where you were one second ago.
But in contrast to the first approach, we can keep certain actions
during recalculation to effectively prevent them from being undone -
**it doesn't have to be all or nothing anymore**. If action A2 from our
example should be kept from being undone, we'd keep it during
recalculation and thus only skip A1.

<img src="recalculation-while-keeping-actions.png" alt="state-recalculation-while-keeping-actions-concept" title="Recalculation allows us to alter history and thus keep certain actions from being undone"/>

However, implementing all of this can get messy and we've only just
covered one direction. While it's definitely possible to use the
[recalculation approach for implementing both undo and redo](https://github.com/JannicBeck/undox),
it'll get a bit too complex for my taste. That's also probably one
reason why there's no library for NgRx doing that.

## States are changing

Although actions in redux may resemble commands, for a
[common undo-redo implementation using the command
pattern](https://www.codeproject.com/Articles/33384/Multilevel-Undo-and-Redo-Implementation-in-Cshar-2)
we'd also need their inverse: a way back, a return path for each state
transition. Luckily, there's an easier way than implementing something
like reverse reducers to improve our approach. States in Redux or NgRx
may be supposed to be immutable, yet reducers are effectively changing
them over time - just not by reusing the same object. You can keep track
of these changes in a so-called
[JSON Patch](https://tools.ietf.org/html/rfc6902)

```typescript
// initial state
const S1 = { "foo": "bar" }

// JSON Patch representing what reducer did to change the state
const patch = [
  { "op": "add", "path": "/baz", "value": "qux" }
]

// result state when applying patch to S1
const S2 = { "foo": "bar", "baz": "qux" }
```

It gets even better: there are libraries constructing these patches for
you and chances are you're already using one of them - namely
[immer](https://github.com/immerjs/immer). The library is used widely to
ensure state immutability while being able to use otherwise mutating
JavaScript APIs. Not only will immer create patches from your
transitions, it'll also provide you with the corresponding inverse
patches. Staying with the example above you'd easily be able to undo an
action using the inverse patch from the corresponding state transition:

```typescript
// result state from before
const S2 = { "foo": "bar", "baz": "qux" }

// JSON Patch representing the reverse of what reducer did to change the state
const inversePatch = [
  { "op": "remove", "path": "/baz" }
]

// resulting initial state when applying inversePatch to S2
const S1 = { "foo": "bar" }
```

Based on that we could then construct our history out of these patches:

```typescript
interface Patches {
  patches: Patch[]
  inversePatches: Patch[]
}

interface History {
  undone: Patches[]
  undoable: Patches[]
}
```

The corresponding middleware or meta-reducer could look along the
following lines - under the assumption that the underlying reducer will
forward the required patches produced by immer.

```typescript
import { applyPatches } from 'immer'

const undoRedo = (reducer) => {
  let history = {
    undone: [],
    undoable: []
  }
  return (state, action) => {
      switch (action.type) {
        case 'UNDO':
          // patches from last action
          const lastPatches = history.undoable[0] 
          // push patches over so they can be used for redo
          history = {
            undone: [lastPatches, ...history.undone],
            undoable: history.undoable.slice(1),
          }
          // derive state before last action by applying inverse patches
          return applyPatches(state, lastPatches.inversePatches)
        case 'REDO':
          // patches from last undone action
          const nextPatches = history.undone[0] 
          // push patches over so they can be used for undo
          history = {
            undoable: [nextPatches, ...history.undoable],
            undone: history.undone.slice(1)
          }
          // derive state before undo (or after original action) by applying patches
          return applyPatches(state, nextPatches.patches)
        default:
          return reducer(state, action, (patches, inversePatches) => {
            // record patches through reducer callback
            history = {
              undoable: [
                {patches, inversePatches},
                ...history.undoable
              ],
              undone: [] // clear redo stack
            }
          })
      }
  }
}
```

Using this approach you're sparred from the memory overhead you'd have
when remembering whole application states and also from the
computational one you'd have when recalculating the last state. By using
just the essential information your implementation can be **maximally
lightweight**. And just like with the approach before, it **doesn't have
to be all or nothing**. If you want to omit an action from the undo-redo
feature you can just ignore its patches when undoing or redoing.

## Bottom line

I hope I was able to give you some understanding of how undo-redo can
work in applications using NgRx or Redux. As mentioned, any approach
will basically get you there - just with different implications. Try
them out by using a library or prototyping them yourself and see what
works best for you.

In a
[recent use-case](https://scenelab.io/) I found the patch-based approach
to be working best for me, causing me to create the library
[ngrx-wieder](https://github.com/nilsmehlhorn/ngrx-wieder) for using it
with NgRx. It'll also allow you to merge consecutive changes of actions
and track whether you can undo or redo at the moment. Here's an example
on StackBlitz:
<iframe 
style="width: 100%; height: 520px"
src="https://stackblitz.com/edit/ngrx-wieder-app?ctl=1&embed=1&file=src/app/app.component.ts&view=preview">
</iframe>
