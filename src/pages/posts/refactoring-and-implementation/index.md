---
path: "/posts/refactoring-and-implementation"
date: "2019-01-07"
title: "Refactoring & Implementation"
published: false
tags: ["architecture", "oop"]
keywords: ["coupling", "interface", "refactoring", "typescript"]
---

![puddle-piano](puddle-piano.gif)

I saw this inspiring [music video](https://www.youtube.com/watch?v=-SqySU-qJQc) and it gave me
the idea for a little exercise. 
I often struggle between getting things done and finding the _perfect abstraction_. Some code is already written
and now you need to add a certain functionality coming in from a different point of view. Parts of your
code shall do things you didn't envision them to be doing when you first designed them. Do you squeeze that new
functionality somewhere between the existing lines? Will you really refactor it afterwards? Can you even effectively
refactor afterwards?

Clean coders from all over the web would argue: either implement or refactor - which one goes first would be up to
style and situation. But in many cases, this seems very counter-intuitive due to the fact that both actions are
inter-dependent. Well, from what I've seen, few pompous maxims every made it freely into any major codebase.
So let's look at an example and try to find some middleground.

Picture this: We've got to bring these two parts together: `Piano` and `Player`. It's foreseeable that in the 
future the player might play something different from a piano - be it a grand piano, a keyboard or even a puddle for
our music video. So let's use an interface to extract the contract between these parts, we'll call it `Playable`. 
It could look like this:
```typescript
interface Playable {
    play(key: Key)
}
```
This interface is associated with the `Player` as the actions originate from him. He deems what's playable - not the 
other way around. A player could get an instance of `Playable` and then may be asked to play a piece of music on it - just
like the following class may suggest:
```typescript
class Player {
    constructor(playable: Playable) {...}
    play(piece: Piece) {...}
}
```
Alright, that's it you might think, after *quickly implementing an algorithm for playing a piece of music*. 
You push the code, it passes review but then it's rejected by QA.
They're saying that it sounds off when a piece of music goes on for longer. Your player is
unable to keep a balanced tempo because he's playing without audible feedback - what a bummer.
The player needs to here what he's playing. Meanwhile, he's supposed to keep the ability to play a puddle - for the 
video, you know.

What I like to do in such a situation is write down some ideas that pop into my head, then
put the problem on hold and come back later with a new perspective. If the solution 
doesn't present itself then, start shuffling things around. Try to find out which solution has the greatest
return of investment - which way solves the problem with minimal obstruction to your core concepts.

So, the player needs to here what he's playing. This could be some kind of stream (think ReactiveX or similar).
A first intuition could be to work the feedback somehow into the `Playable` interface. It could be the return value of
 `Playable.play(key)` or we could add a second method as some kind of getter. Yet, this would introduce 
significant unwanted coupling through the `Playable` interface. The player won't be able to play the puddle anymore 
as it wouldn't be able to provide feedback - well except for some splash sounds maybe. A puddle would have to return 
an undefined value or throw an exception - *eww that's ugly*.
It might be made prettier by extending the `Playable` interface and creating something like the following
```typescript
interface PlayableWithFeedback extends Playable {
    play(key: Key)
    listen(): AudioStream
}
```
The piano would be able to implement the more specific interface, while the puddle remains just playable without 
feedback. But then it would be the player's responsibility to figure out what he's working with. He might do this
through some `instanceof` checking or even pattern matching, if your language is capable of such  things. Still, for 
my taste this would shift responsibility in the wrong direction.  

Instead let's extract this new functionality into a different contract `Hearable`
```typescript
interface Hearable {
    listen(): AudioStream
}
```
A player which isn't supposed to be off-tempo at some point should have all the necessary resources at hand
for that task. Therefore, let's adjust our player implementation. This way he can adapt his playing according to
what he's hearing:
```typescript
class Player {
    constructor(playable: Playable, hearable: Hearable) {...}
    play(piece: Piece) {...}
}
```
We can now have a player play a piano or a puddle without getting off-tempo. We might facilitate this by providing
something different as the feedback source for objects that are `Playable` but not `Hearable`. This way we could combine
the puddle with a stereo playing a recording to reconstruct the music video.
```typescript
const piano: Playable & Hearable = new Piano()
const pianoPlayer: Player = new Player(piano, piano)

const stereo: Hearable = new Stereo(new Recording('recording.mp3'))
const puddle: Playable = new Puddle()
const puddlePlayer: Player = new Player(puddle, stereo)
```

## Bottom line
As is the curse of examples, your current problem might not be as simple as this one. Still, I think it makes the point
that it's seldom easy to see the consequences of introducing new functionality to your code. It's hard to draw
the line between refactoring and implementation. Sometimes you can't prevent changes to the way your code is coupled. 
Instead, what you want to do is prevent coupling in ways you don't deem future-proof. Your refactoring will be 
opinionated towards your implementation. Therefore you'll need a vision which you have to match constantly in congruence 
to your code. This way the vision is not only in your head and manifested at runtime, but also visible in code.