---
path: "/posts/everything-looks-better-with-an-image"
date: "2018-12-22"
title: "Everything Looks Better with an Image"
published: true
tags: ["web development", "frontend"]
keywords: ["ui", "framework", "freelance", "assets", "styleguide"]
---

Did you ever play around with the latest UI framework's components but nothing you came up with was quite satisfying?
The specs gave you half the story for the use-case you're supposed to implement and money for a designer was already
spent on someone's stand-up desk. Now it's on you to come up with something decent for bringing those new properties
from the user's brain into the database. It can't be that hard! Just play around a bit and come up with something that looks
decent on [any imaginable device](https://www.unihertz.com/blog/media-3/post/this-adorable-device-might-be-the-worlds-smallest-4g-smartphone-check-it-out-57).
That's your job as a frontend developer, isn't it?!

## UI frameworks are a trap

> Just stick 'em together and ship it

That seldom worked out for me when trying to solve specific problems instead of building another highly-demanded todo
app. Well, it technically works, but they'll give you the looks. Popular end-consumer apps really spoiled the game for
enterprise interfaces - you're *expected* to keep up. So, in order to have something to start off on, someone decided
to integrate a UI framework. Maybe that someone even went above and beyond and checked if the provided components match
roughly with the app's core use-cases, rather than just picking the one that's easiest to setup. Still, in most cases
 you'll hit the limits in no time. Now what? You're already knee deep into those juicy dropdowns, modals and 
side-navs. You're not quite sure anymore what's framework and what's just straight up magic.

Instead, keep your UI frameworks at an [arms-length](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html).
Establish simple and extensible mechanisms - mostly, learn modern web-development. Get familiar with the good stuff 
that's come up like media queries, modularization, flexbox, grid - to name a few. Don't shy away from 
building you own components. With modern tooling it's a breeze. 
You can actually still write HTML, (S)CSS and JS yourself and end up with way less of it while solving your specific 
use-case. The web may be over-engineered but try to use it to your advantage. Once you're inside a certain UI framework,
it becomes difficult to color outside the lines. Work with abstractions. Don't use a component, if it ties you
to a [bunch of too specific boilerplate for a mediocre solution](https://material.angular.io/components/table/overview).

## Establish facts

You can do your work as thorough as you might. Curse and saviour of the web is that it's open for any device and 
user-agent. Therefore you need some ground rules. Under which circumstances is your app supposed to run? You just can't
stretch a design at will. Desktop and mobile differ in more than just screen size. Nothing is more de-motivating than
reworking something over and over again because you found yet another place where it looks off (unrelated hint: 
don't even try to use [grid in IE](https://rachelandrew.co.uk/archives/2016/11/26/should-i-try-to-use-the-ie-implementation-of-css-grid-layout/)).
A great way to minimize such iterations is by establishing a style guide. Setup guidelines for things like typography, 
colors, navigation patterns and extend them as you go. You may do this inside some document, yet just like any other
artifact, distance from code correlates with obsolescence. There are [better options](https://github.com/storybooks/storybook).
 The facts have to be easy to access and hard to evade.

## Interfaces are boring

Accept it, your enterprisy CRUD app may never win any design award. It won't hold up to the apps you use regularly on your 
phone. Yet, it doesn't have to in most cases. Your interface isn't supposed to stand out. You just need a place to put
content - and if there isn't too much content, fake it. Take a look at the designs you've recognized over the last 
time - I'll bet they've got huge shiny photography and playful pictographs all over the place. Don't overdo it, start 
simple and start with content. Work things out over time and minimize complexity.

## It's a freelance economy

Nowadays you can buy a logo, a set of UI components, a landing page design or even a whole corporate identity for the 
cash you pay developers per hour. It's not absolutely necessary to hire an agency for some sweet assets.
Do the math on "build or buy" rather than staying in the comfort zone and letting people do work outside of
their competency at exponentially higher costs.

Like software development, design isn't diligence work. You can't cut the process short and expect the same
 results. It's easier than ever to build great user experiences, if you're not saving in the wrong places.
