---
path: "/posts/everything-looks-better-with-an-image"
date: "2018-12-17"
title: "Everything looks better with an image"
published: true
tags: ["web development", "ui", "frontend"]
---

Did you ever play around with the latest UI framework's components but nothing you came up with was quite satisfying?
The specs gave you half the story for the use-case you're supposed to implement and money for a designer was already
spend on someone's stand-up desk. Now it's on you to come up with something decent for bringing those new properties
from the user's brain into the database. It can't be that hard! Just play around a bit and come up with something that looks
decent on [any imaginable device](https://www.unihertz.com/blog/media-3/post/this-adorable-device-might-be-the-worlds-smallest-4g-smartphone-check-it-out-57).
That's your job as a frontend developer, isn't it?!

## UI frameworks are a trap

> Just stick 'em together and ship it

That seldom worked out for me when trying to solve specific problems instead of building another highly-demanded todo
app. Well, it technically works, but they'll give you the looks. Popular end-consumer apps really spoiled the game for
enterprise interfaces - you're *expected* to keep up. So, in order to have something to start off on, someone decided
to integrate a UI framework. Maybe that someone even went above and beyond and checked if the provided components match
roughly with the app's core use-cases, rather than just picking the one that's easiest to setup. Still, most of the
times you'll hit the limits in no time. Now what? You're already knee deep into those juicy dropdowns, modals and 
side-navs. You're not quite sure anymore what's polyfilled and what's just straight up magic. Therefore, keep your
UI frameworks at an [arms-length](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html).
Establish simple and extensible mechanisms - mostly, learn modern web-development. Use the good CSS stuff that's come
up like:
* Media Queries
* Modules
* Variables
* Flexbox
* Grid // inline enumeration?

Don't shy away from building you own components. With modern tooling it's a breeze, you can actually still write HTML, 
(S)CSS and JS yourself and end up with way less of it while solving your specific use-case. 
The web is over-engineered enough as it is.

## Establish facts

You can do your work as thorough as you might. Curse and saviour of the web is that's it's open for any device and 
user-agent. Therefore you need some ground rules. Under which circumstances is you app supposed to run? You just can't
scale a design as desired. Desktop and mobile differ in more than just screen size. Nothing is more de-motivating than
reworking something over and over again because you found yet another place where it looks off.
// design guide

## Interfaces are boring

Accept it, your enterprisy CRUD app may never win any award. It won't hold up to the apps you use regularly on your 
phone. Yet, it does'nt have to in most cases.

// target audience, product building or solving a business problem

## Skip the middleman, it's a freelance economy
// you don't need to hire an agency for some sweet assets
// take a look at the designs you've recognized over the last time
// i'll bet they've got sleek imagery - in the end it's always about content

// Fazit
// You'll have to spent time on design / hire a designer 
// start simple, work things out over time - technically and in regards to usablity