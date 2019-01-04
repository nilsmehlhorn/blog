---
path: "/posts/interface-and-implementation"
date: "2019-01-04"
title: "Interface & Implementation"
published: true
tags: ["architecture", "oop"]
---
![puddle-piano](puddle-piano.gif)

I saw this inspiring [music video](https://www.youtube.com/watch?v=-SqySU-qJQc) and it gave me
the idea for a little exercise - interface and implementation. 

// TODO: remove "supposed to" intro
I often struggle between getting things done and finding the *perfect abstraction*. Some code is already written
and now you're supposed to add a certain functionality coming in from a different point of view. Parts of your
code shall do things you didn't envision them to be doing when you first designed them. Do you squeeze that new
logical vector somewhere between the existing lines? Will you really refactor it afterwards? Can you even effectively
refactor afterwards?

Clean coders from all over the web would argue: either implement or refactor - which one goes first would be up to
style and situation. But in many cases, this seems very counter-intuitive due to the fact that both actions are
inter-dependent. Well, from what I've seen, few pompous maxims every made it freely into any major codebase.
So let's look at an example and try to find some middleground.

We've got these two logical parts: `Piano` and `Player`. Let's use an interface to extract the contract
between the two, we'll call it `Playable`. It could look like this:
```typescript
interface Playable {
    void press(Key key)
}
```
This interface is associated with the `Player` as the actions originate from him - not the other way around.
This way a playable thing isn't restricted to being a piano, but might as well be a puddle.
A player could get an instance of `Playable` and then may be asked to play a piece of music on it - just
like the following class may suggest:
```typescript
class Player {
    constructor(Playable playable) {...}
    void play(Piece piece) {...}
}
```
Alright, that's it you might think. You push the code, it passes review but then QA rejects it.
They're saying that it sounds off when a piece of music goes on for longer. Your player is
unable to keep a balanced tempo because he's playing without audible feedback - what a bummer.

*note: what I like to do in such a situation is writing down some ideas that pop into my head, then
doing something completely different and coming back to the problem later with a new perspective*

So, the player needs feedback. This could be some kind of stream (think ReactiveX or similar). We'll wrap it into a
`Feedback` object for now. This way we can focus on the problem at hand. A first intuition could be to return this 
feedback from the call to `Playable.press(key)`. Yet, this would introduce significant coupling. The player won't be 
able to play the puddle anymore as it wouldn't be able to provide feedback - well except for some splash sounds maybe. 
A similar - yet way worse - option would be to extend the `Playable` with some getter for the feedback. A puddle could 
return null or throw an exception for that method, *eww*.

Instead, a player which isn't supposed to be off tempo at some point should have all the necessary resources at hand
for the task.

// either do inheritence or constructor overload, i think the first one is the way to go

// idea: second interface with stream of values for Sound - Feedback, PlayableWithFeedback?

// this way you can play on a puddle while playing music from a stereo

// it's not about preventing coupling, but preventing coupling in ways we don't deem future-proof
// is this example to simple? Most things that fit into a blog post are too simple