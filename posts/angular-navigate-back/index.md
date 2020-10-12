---
path: '/posts/angular-navigate-back-previous-page'
date: '2020-10-12'
title: 'How to Navigate to Previous Page in Angular'
published: true
tags: ['web development', 'frontend', 'angular']
keywords: ['router', 'history', 'back button', 'user experience', 'navigation']
description: "Here's how you implement a back button to navigate to the previous page in Angular. We'll explore static and dynamic routing approaches in a live example."
banner: './banner.jpg'
---

```toc

```

Sometimes we would like to offer users a way to navigate back to where they had been before. Generally, this is what the browser's back button is for, but we can also provide the same feature in other places. For example when there's a list of users linked to a detail view and youwant to display some kind of back button to return to the list. Let's explore a couple different approaches - scroll to the end to see a working example with all of them.

This is how I'm setting up my routes for this example. Note that `UserListComponent` is supposed to contain a list of all users, while `ActiveUsersComponent` contains only some. Both components will link to `UserDetailComponent` from which we'd then like to navigate back.

```typescript
const routes: Routes = [
  {
    path: 'users',
    component: UsersComponent,
    children: [
      {
        path: '',
        component: UserListComponent,
      },
      {
        path: 'active',
        component: ActiveUsersComponent,
      },
      {
        path: ':id',
        component: UserDetailComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'users',
  },
]
```

## Static Back Navigation with Routing

One solution would be defining a router link in the detail component and explicitly navigating back to the parent:

```html
<a routerLink="/users">Back with Absolute Routing</a>
```

Alternatively, you could also do this programmatically from the component class, but keep in mind that router links are more semantic than navigations triggered through click events.

```typescript
import { Router } from '@angular/router'

@Component({})
export class UserDetailComponent {
  constructor(private router: Router) {}

  back(): void {
    this.router.navigate('/users')
  }
}
```

While this implementation is fine in general, it might get repetitive for multiple different child components. Also, it won't work in places where you don't really know the parent route, e.g. when you're displaying some kind of content header which always provides a back button.

Another solution involves relative routing. You might be familiar with relative routes from links pointing towards children, but they can also be used the other way around where two dots reference the parent route:

```typescript
back(): void {
    this.router.navigate("..");
}
```

```html
<a routerLink="..">Back with Relative Routing</a>
```

However, this will only work when the list component is registered as the child with an empty path or when there's a redirect to the list component. Basically, this approach just navigates one layer up in the the routing hierarchy.

Both absolute and relative routes won't necessarily go back to where the user has been before. They provide static navigation and it's already clear during development where the corresponding navigations will end up. Therefore, it's not easily possible to go back to `/users/active` even when this is where the user was before navigating to the detail view.

[[info]]
| Join my [mailing list](https://nils-mehlhorn.de/newsletter) and follow me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn) for more in-depth Angular knowledge

## Dynamic Back Navigation with Browser History

The browser's back button is based on the [browser history](https://developer.mozilla.org/en-US/docs/Web/API/History). Luckily, it has a JavaScript API which we can use to navigate dynamically back and forth through our Angular application. In fact, Angular even provides the [Location](https://angular.io/api/common/Location) service as a platform abstraction.

This service has a `back()` method which does exactly what we want: it navigates one step back in the browser's history. We can inject the service into the detail component or any intermediate component and call it upon a button click:

```typescript
import { Location } from '@angular/common'

@Component({})
export class UserDetailComponent {
  constructor(private location: Location) {}

  back(): void {
    this.location.back()
  }
}
```

This solves the problem we had before and the user can now navigate back to the actual list he came from. You can try this in the example below:

1. `/users`: Click on first user
2. `/users/1`: Click on "back with location"
3. `/users`: Works! Now click on "Active"
4. `/users/active`: Click on the first user
5. `/users/1`: Click on "back with location"
6. `/users/active`: Also works!

Sadly, there's one edge case: if the application is started on the detail router after opening the browser or a new tab there's no entry in the history to go back to. In that case `location.back()` will throw the user out of your Angular app. There's also no API for directly inspecting the browser history as that might pose security issues, but there's still a way how we can fix this.

We'll create a service for wrapping the back navigation. There we'll also be listening to router events of type [NavigationEnd](https://angular.io/api/router/NavigationEnd) to manage an app-specific navigation history. Now, if the history still contains entries after popping the current URL off of the stack, we can safely navigate back. Otherwise we're falling back to the application route:

```typescript
import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Router, NavigationEnd } from '@angular/router'

@Injectable()
export class NavigationService {
  private history: string[] = []

  constructor(private router: Router, private location: Location) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.history.push(event.urlAfterRedirects)
      }
    })
  }

  back(): void {
    this.history.pop()
    if (this.history.length > 0) {
      this.location.back()
    } else {
      this.router.navigateByUrl('/')
    }
  }
}
```

We can then inject the `NavigationService` into components and call it's custom `back()` method instead of directly using Angular's `Location` service:

```typescript
import { NavigationService } from './navigation.service'

@Component({})
export class UserDetailComponent {
  constructor(private navigation: NavigationService) {}

  back(): void {
    this.navigation.back()
  }
}
```

Additionally, we could wrap the existing solution in an Angular directive for easy re-use. Simply inject the `NavigationService` and call the `back()` method using a [HostListener](https://angular.io/api/core/HostListener):

```typescript
import { Directive, HostListener } from '@angular/core';
import { NavigationService } from './navigation.service';

@Directive({
  selector: '[backButton]'
})
export class BackButtonDirective {

  constructor(private navigation: NavigationService) { }

  @HostListener('click')
  onClick(): void {
    this.navigation.back();
  }

}
```

Afterwards you can apply the directive in component templates like this:

```html
<button backButton>Back with NavigationService</button>
```

## Live Example

Here's a StackBlitz showing examples for all approaches. If you've got any questions post a comment below  or ping me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn). Also follow me there and join my [mailing list](https://nils-mehlhorn.de/newsletter) to get notified when I'm posting something new.

<iframe 
style="width: 100%; height: 550px"
src="https://stackblitz.com/edit/angular-back-previous-page?ctl=1&embed=1&view=preview">
</iframe>

