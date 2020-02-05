---
path: "/posts/angular-single-http-request-unsubscribe"
date: "2020-02-01"
title: "Why you have to unsubscribe even for a single HTTP request"
published: false
tags: ["web development", "frontend", "angular"]
keywords: ["angularjs", "loading", "directive", "rxjs", "observable"]
#banner: "./banner.png"
description: ""
---


## Manual Subscription Management

The first option is manually listening for new values from an observable
by registering a callback in `subscribe()`. Below you can see an example
of this. As I've mentioned in my article on
[loading indication in Angular](https://nils-mehlhorn.de/posts/indicating-loading-the-right-way-in-angular),
this is also the only way to handle observables which represent actions
that won't result in something you'll display in your template.
```typescript
@Component(...)
export class UsersComponent implements OnInit, OnDestroy {

    users: User[] = []
  
    private unsubscribe$ = new Subject<void>()

    constructor(private users: UserService) {}
    
    ngOnInit(): void {
      this.users.getAll()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(users => {
          this.users = users
        })
    }
    
    ngOnDestroy(): void {
      this.unsubscribe$.next()
      this.unsubscribe$.complete()
    }
}
```
```html
<p>
  There are {{ users.length }} online.
</p>
```

One thing to keep in mind here is that you'll want to unsubscribe from
any pending observable when your component is destroyed. You can do this
most elegantly by using the `takeUntil()` RxJS operator. Have a look at
Ben Lesh's article for more info on that.

> [RxJS: Don’t Unsubscribe](https://medium.com/@benlesh/rxjs-dont-unsubscribe-6753ed4fda87)
> by Ben Lesh

Some people claim that it's unnecessary to unsubscribe from observables
that you're expecting to only emit a single value - like a one-off HTTP
call for example. I'd advise you unsubscribe regardless for two reasons:

1. **RxJS subscriptions are cancellable**. This means that unsubscribing
   from an observable representing a HTTP request will cancel that
   request. When a user changes their mind and closes your component
   after kicking off an action, this action might be nullified as the
   user most likely intended by navigating away.
   
2. **You'll break the contract**. The whole reason for encapsulating
   HTTP requests into services is that your components aren't supposed
   to know where the data is coming from. By unsubscribing even when you
   know that your service is *just* doing one HTTP request right now, you
   won't have to remember changing your component later on when it might
   deliver multiple values over time, e.g. through a web socket or long
   polling.
