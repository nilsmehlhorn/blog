---
path: '/posts/ngrx-keep-state-refresh'
date: '2020-11-10'
title: 'How to Keep NgRx State on Refresh'
published: true
tags: ['web development', 'frontend', 'angular']
keywords: ['angular', 'ngrx', 'store', 'redux', 'rxjs', 'observable']
banner: './ngrx-rehydration-banner.jpg'
description: "Learn how to keep the state of the NgRx store between page reloads with Redux devtools and re-hydration from localStorage."
---

```toc
```

It's a common requirement: persisting NgRx state in order to load it back up when your Angular application is restarted. This process of populating an empty object with domain data is called re-hydration. While it's common to persist the store data to the browser storage (mostly [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)), you might also re-hydrate from a server-side cache.

[[book]]
| **[📕 I've written a book on NgRx.](https://gumroad.com/l/angular-ngrx-book)** Learn how to structure your state, write testable reducers and work with actions and effects from one well-crafted resource.

There are some pitfalls to watch out for when applying this pattern. For one thing, you should take care not to store sensitive data in potentially insecure storages. Consider factors such as multiple users working on the same machine. Additionally, the state you're storing can become outdated. Consequently, you might incorporate techniques like validation and partial re-hydration. 

Also, keep in mind that the shape of your application state can change between different releases. Meanwhile, your clients will have old versions in their storage - carelessly re-hydrating those will probably break your app. Possible solutions might involve tracking some kind of version or deep-checking state keys. Depending on the outcome you could discard or migrate serialized states.

For this example we'll develop a simplified solution that saves the whole root state to the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

## Persist with Redux DevTools

⚡ [**Example on StackBlitz**](https://stackblitz.com/edit/ngrx-counter-example-devtools)

If you just want this feature for development purposes, you don't need to lift a finger: it's already built-in. When you install the [Redux DevTools](https://github.com/reduxjs/redux-devtools) addon in your browser while instrumenting your store with [@ngrx/store-devtools](https://ngrx.io/guide/store-devtools) you'll be able to persist the state and action history between page reloads.

Here's how this looks in practice:

<figure className={styles.wrapper}>
    <video autoPlay loop>
        <source src="./ngrx-devtools-persist.mp4" type="video/mp4" />
    </video>
    <figcaption>Persisting NgRx State between page reloads with Redux DevTools</figcaption>
</figure>

You can't really ask your users to install a browser extension. So, read on if you want to re-hydrate the store to improve not only the developer experience but user experience as well.

[[info]]
| Join my [mailing list](https://nils-mehlhorn.de/newsletter) and follow me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn) for more in-depth Angula knowledge

## Re-Hydration Meta-Reducer

⚡ [**Example on StackBlitz**](https://stackblitz.com/edit/ngrx-rehydration)

The popular approach for implementing re-hydration is based on [meta-reducers](https://ngrx.io/guide/store/metareducers). Such a re-hydration meta-reducer would have to do two things:

1. Persist the resulting state after each action has been processed by the actual reducer(s)
2. Provide persisted state upon initialization

Persisting the result state is pretty straight-forward from inside a meta-reducer: we'll serialize the state object to JSON and put it into the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). When you've taken care to keep the state serializable, this should work right-away. 

Additionally, NgRx calls reducers once with an undefined state and an [`INIT`](https://ngrx.io/api/store/INIT) action to retrieve the initial state. This would be the place for parsing a potentially existing stored state and returning it instead of the underlying reducer's initial state. Here's how a corresponding meta-reducer might look:

```typescript
// hydration.reducer.ts
import { ActionReducer, INIT } from "@ngrx/store";
import { RootState } from "..";

export const hydrationMetaReducer = (
  reducer: ActionReducer<RootState>
): ActionReducer<RootState> => {
  return (state, action) => {
    if (action.type === INIT) {
      const storageValue = localStorage.getItem("state");
      if (storageValue) {
        try {
          return JSON.parse(storageValue);
        } catch {
          localStorage.removeItem("state");
        }
      }
    }
    const nextState = reducer(state, action);
    localStorage.setItem("state", JSON.stringify(nextState));
    return nextState;
  };
};
```

Note that I'm wrapping the parsing into a try-catch block in order to recover when there's invalid data in the storage.

Since we're trying to re-hydrate the whole store, we'll have to register the meta-reducer at the root:

```typescript
// index.ts
import { MetaReducer } from "@ngrx/store";
import { hydrationMetaReducer } from "./hydration.reducer";

export const metaReducers: MetaReducer[] = [hydrationMetaReducer];
```

```typescript
// app.module.ts
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './store';

@NgModule({
  imports: [
    StoreModule.forRoot(reducers, { metaReducers })
  ]
})
```

There's a well-known library called [ngrx-store-localstorage](https://github.com/btroncone/ngrx-store-localstorage) you might utilize to sync your store to the localStorage. It's leveraging this plain meta-reducer approach and offers some advantages over a custom implementation.

[[info]]
| Got stuck? Post a comment below or ping me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn)

## Re-Hydration Meta-Reducer + Effects

⚡ [**Example on StackBlitz**](https://stackblitz.com/edit/ngrx-rehydration-effect)

Serialization, parsing and persistence are processes that clearly sound like side-effects to me. Just because [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), [`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) and the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) are synchronous APIs, doesn't mean they're pure. Placing them into a reducer (or meta-reducer) is in itself a violation of NgRx principles. That doesn't mean it's not allowed to implement re-hydration this way, but there might be value in a different approach

Let's rethink re-hydration based on the NgRx building blocks. Interactions with browser APIs should go into effects. However, setting the state is not possible from an effect, so we'll still need a reducer, or rather a meta-reducer. It would only hydrate the state based on an action dispatched by an effect.

We'll start by defining an action that kicks-off the hydration as well as two additional actions that indicate whether a stored state could be retrieved:

```typescript
// hydration.actions.ts
import { createAction, props } from "@ngrx/store";
import { RootState } from "..";

export const hydrate = createAction("[Hydration] Hydrate");

export const hydrateSuccess = createAction(
  "[Hydration] Hydrate Success",
  props<{ state: RootState }>()
);

export const hydrateFailure = createAction("[Hydration] Hydrate Failure");
```

Our meta-reducer can be incredibly simple and thus remain pure: it just has to replace the state based on `hydrateSuccess` actions. In any other case it'll execute the underlying reducer.

```typescript
// hydration.reducer.ts
import { Action, ActionReducer } from "@ngrx/store";
import * as HydrationActions from "./hydration.actions";
import { RootState } from "..";

function isHydrateSuccess(
  action: Action
): action is ReturnType<typeof HydrationActions.hydrateSuccess> {
  return action.type === HydrationActions.hydrateSuccess.type;
}

export const hydrationMetaReducer = (
  reducer: ActionReducer<RootState>
): ActionReducer<RootState> => {
  return (state, action) => {
    if (isHydrateSuccess(action)) {
      return action.state;
    } else {
      return reducer(state, action);
    }
  };
};
```

The `isHydrateSuccess()` helper function implements a [user-defined type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html). This way we can safely access the `state` payload property based on the action type of `hydrateSuccess`.

Now we can write the effect that dispatches `hydrateSuccess` and `hydrateFailure` actions based on whether there's a serialized state available from the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). It'll be started by a `hydrate` action that we return through the [`OnInitEffects`](https://ngrx.io/api/effects/OnInitEffects) lifecycle. We'll then try to retrieve a value from the storage using the constant key `"state"` in order to parse it and return the corresponding hydration actions. If we're successful in parsing the state, it'll end up at our meta-reducer which puts it into the NgRx store.

```typescript
// hydration.effects.ts
import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType, OnInitEffects } from "@ngrx/effects";
import { Action, Store } from "@ngrx/store";
import { distinctUntilChanged, map, switchMap, tap } from "rxjs/operators";
import { RootState } from "..";
import * as HydrationActions from "./hydration.actions";

@Injectable()
export class HydrationEffects implements OnInitEffects {
  hydrate$ = createEffect(() =>
    this.action$.pipe(
      ofType(HydrationActions.hydrate),
      map(() => {
        const storageValue = localStorage.getItem("state");
        if (storageValue) {
          try {
            const state = JSON.parse(storageValue);
            return HydrationActions.hydrateSuccess({ state });
          } catch {
            localStorage.removeItem("state");
          }
        }
        return HydrationActions.hydrateFailure();
      })
    )
  );

  constructor(private action$: Actions, private store: Store<RootState>) {}

  ngrxOnInitEffects(): Action {
    return HydrationActions.hydrate();
  }
}
```

What's still missing is an effect that persists the current state to the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) in the first place. We'll base it off of the actions stream in order to wait for either an `hydrateSuccess` or `hydrateFailure`. This way we won't overwrite an existing state before the re-hydration is done. Then we stop looking at actions an instead subscribe to the store with the [`switchMap()`](https://rxjs.dev/api/operators/switchMap) operator. Slap a [`distinctUntilChanged()`](https://rxjs.dev/api/operators/distinctUntilChanged) on top and you'll have a stream that emits the state any time it changes. Lastly, we'll mark the effect as [non-dispatching](https://ngrx.io/guide/effects/lifecycle#non-dispatching-effects) and serialize the state to the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) inside of a [`tap()`](https://rxjs.dev/api/operators/tap) operator.

```typescript
// hydration.effects.ts
serialize$ = createEffect(
  () =>
    this.action$.pipe(
      ofType(HydrationActions.hydrateSuccess, HydrationActions.hydrateFailure),
      switchMap(() => this.store),
      distinctUntilChanged(),
      tap((state) => localStorage.setItem("state", JSON.stringify(state)))
    ),
  { dispatch: false }
);
```

Don't forget to register the new effect class in your module declaration. Additionally, you'd be better off [injecting the `localStorage`](https://angular.io/guide/dependency-injection-in-action#supply-a-custom-provider-with-inject) and/or outsourcing the whole parsing and persistence process into another service.

Apart from complying with the NgRx principles, this effect-based re-hydration implementation additionally allows us to

- leverage dependency injection and thus ease testing
- incorporate time-based filtering (e.g. RxJS operators like [`auditTime()`](https://www.learnrxjs.io/learn-rxjs/operators/filtering/audittime))
- perform advanced error handling
- re-hydrate from asynchronous sources

The only disadvantage would be that we can't provide a stored state as a direct replacement for the initial state. If that's a requirement, you might try to [register reducers via dependency injection](https://ngrx.io/guide/store/recipes/injecting) in order to still get around an impure implementation.