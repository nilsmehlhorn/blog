---
path: "/posts/angular-environment-setup-testing"
date: "2019-11-21"
update: "2020-08-13"
title: "Angular Environment Setup - Safe & Testable"
published: true
tags: ["web development", "frontend", "angular"]
keywords: ["test", "testing", "deploy", "angularjs", "typescript"]
banner: "./banner.png"
description: "Here's how you setup and access Angular environments with a proper type for multiple builds and tests with a mock - production-ready and with examples."
---

Most real-world Angular applications live in different environments
throughout their development cycle. While differences generally should
be kept to a minimum, your webapp is probably supposed to behave a
little bit different on a developer's machine compared to when it's
deployed to production.

Angular and the Angular CLI already provide a solution for this called
[environments](https://angular.io/guide/build#configuring-application-environments).
To recap how they work: you place an arbitrary number of environment
files in a directory such as `src/environments` like so: 
```
src
└── environments
    ├── environment.prod.ts
    ├── environment.stage.ts
    └── environment.ts
```

Any non-default environment is suffixed correspondingly, for example
with 'prod' for your production environment. Here we also configure a staging environment which you might use for QA or testing deployments. Sometimes you'll also have a specific environment for continuous integration (CI).

Inside of every file you'll export an object called `environment`
defining the same properties just with environment-specific values. This
could be a boolean flag indicating a production environment or the
environment's name:

```typescript
// environment.ts
export const environment = {
  production: false,
  name: 'dev',
  apiPath: '/api'
}
```

```typescript
// environment.stage.ts
export const environment = {
  production: false,
  name: 'stage',
  apiPath: '/stage/api'
}
```

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  name: 'prod',
  apiPath: '/prod/api'
}
```

Here the path under which you can reach the backend server also differs between environments - indicated by the `apiPath` property. However, when properties are re-used in many placed but don't change with the environment you may want to introduce a single separate `constant.ts` file.

Now in order to let the application use a different environment for
different builds, you'll define a build configuration for each
environment inside your `angular.json`. There you'll configure a file
replacement which will switch `environment.ts` for a specific override
such as `environment.prod.ts` like so:

```json
"architect": {
  ...
  "build": {
    "builder": "@angular-devkit/build-angular:browser",
    "options": {...},
    "configurations": {
      "production": {
        "fileReplacements": [{
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }],
        ...
      },
      "stage": {
        "fileReplacements": [{
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.stage.ts"
        }],
        ...
      }
    }
  }
  ...
}
```

When building, you'll activate a configuration - thus an environment - by passing it's name to
the Angular CLI: 
```commandline
ng build --configuration <config>
```

__Hint__: when you're using `ng build --prod` it'll pick the
configuration called 'production'.

That's actually it: file replacements and plain JavaScript objects - not
too much Angular magic. Now you'd just import from `environment.ts` and
always get the environment-specific properties during runtime:

```typescript
import { environment } from '../environments/environment';

// ng build             --> 'dev'
// ng build -c stage    --> 'stage'
// ng build --prod      --> 'prod'
console.log(environment.name)
```

But we can do better. There's two problems I encountered with this
setup:
1. When adding new properties to `environment.ts` it's easy to forget
   adding counterparts in the other environment files 
2. You can't perform environment specific tests

Let's solve these issues with two changes to our setup.

## Typing the Environment

Angular means TypeScript, so why not profit from the languages benefits
here? By typing our environment we get notified by the compiler when any
of our environments are missing properties. To do so, we'll define an
interface for our environment in a file called `ienvironment.ts`:

```typescript
export interface Environment {
  production: boolean
  name: string
  apiPath: string
}
```

Now, when defining environment objects we'll declare their types to be
of our newly created interface:

```typescript
import {Environment} from './ienvironment'

export const environment: Environment = {
  production: false,
  name: 'dev',
  apiPath: '/api'
}
```

Do this in all your environment files and you'll greatly benefit from
the type system. This way you won't get any surprises when deploying a
new environment-related feature.

[[info]]
| Got stuck? Post a comment below or ping me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn)

## Testing with Environments

Sometimes I found myself in situations where I'd wanted to perform
environment-specific tests. Maybe you'd have an error handler that
should only log to the console in a development environment but
[forward errors to a server](/posts/angular-error-tracking-with-sentry)
during production. As environments are simply imported it is
inconvenient to mock them during test execution - let's fix that.

The Angular architecture is based on the principle of
[dependency injection](https://angular.io/guide/dependency-injection)
(DI). This means that a class (e.g. a component or service) is provided
with everything it needs during instantiation. So any dependencies are
injected by Angular into the class constructor. This allows us to switch
these dependencies for mocked counterparts during testing.


[[info]]
| Join my [mailing list](https://nils-mehlhorn.de/newsletter) and follow me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn) for more in-depth knowledge on web development.

When providing our environment through dependency injection, we'll be
able to easily mock it for environment-specific test cases. For this we
create another file `environment.provider.ts` where we define an
[InjectionToken](https://angular.io/api/core/InjectionToken). Usually
Angular uses the class name to identify a dependency, but since our
environment only has a TypeScript interface (which will be gone at
runtime) we need to provide such a token instead. Additionally, since
Angular cannot call an interface's constructor, we provide a factory
method to get the environment instance. Eventually, our provider code
looks like this: 
```typescript
import {InjectionToken} from '@angular/core'
import {Environment} from './ienvironment'
import {environment} from './environment'

export const ENV = new InjectionToken<Environment>('env')

export function getEnv(): Environment {
  return environment;
}
```

Then we'll pass this provider to our Angular module by adding it to the
`providers` list: 
```typescript
import {ENV, getEnv} from '../environments/environment.provider'

@NgModule({
  ...
  providers: [
    {provide: ENV, useFactory: getEnv}
  ]
})
export class AppModule { }
```

Now, instead of importing from `environment.ts` directly we'll inject
the environment into any class that needs access to it by using the
[Inject](https://angular.io/api/core/Inject) decorator.

```typescript
import { Injectable, Inject } from '@angular/core';
import { Environment } from '../environments/ienvironment'
import { ENV } from '../environments/environment.provider'

@Injectable() 
export class UserService {

  constructor(@Inject(ENV) private env: Environment) {
  }
  
  save(user: User): Observable<User> {
      if (this.env.production) {
        ...
      } else {
        ...
      }
  }
  
}
```

In order to mock our environment during test we can now easily pass a
counterpart
[directly into the class constructor](https://angular.io/guide/testing#services-with-dependencies)
or provide it through Angular's
[dependency injection using the TestBed](https://angular.io/guide/testing#testing-services-with-the-testbed)
like this:
```typescript
import { ENV } from '../environments/environment.provider'

describe('UserService', () => {
  describe('when in production', () => {
      beforeEach(() => {
        const env = {production: true, ...}
        // without TestBed
        const service = new UserService(env)
        // or with TestBed
        TestBed.configureTestingModule({
          providers: [
            {provide: ENV, useValue: env}
          ]
        });
      });
  });
});
```

Also, if you'd like to enforce that the environment is used through
dependency injection, you might even create a
[tslint rule blocking direct imports](https://stackoverflow.com/questions/51742983/how-blacklist-imports-in-a-specific-file-with-tslint)
preventing unintended usage.

### Wrapping up

With a little bit of setup we were able to make using Angular
environments safer and more comfortable. We've already got typing and
dependency injection at our disposal, so it's advisable to leverage
these tools for a better development experience. Especially in bigger
applications with multiple environments we can greatly benefit from
properly defined interfaces, good test coverage and test-driven
development.
