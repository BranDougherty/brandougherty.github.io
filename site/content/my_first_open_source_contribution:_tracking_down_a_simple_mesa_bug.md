I'm writing this article to chronicle my entry into open source. I tell it through story of tracking down a small bug. I hope it will be interesting to people who wish to understand where new open source contributors come from.

#### Part 1: Open source comes to me

This story starts with my favorite video game, [Soldat](https://soldat.pl/en/). I've been playing Soldat for over 10 years, and the addicting gameplay keeps me coming back. For a number of years now, however, development of the game has mostly stagnated. This is to be expected. After all, its an ~18 year old game, with only a fraction of the playerbase it once had. Most people have moved on to other games.

However, with the work of a few volunteer developers (working with the creator of the game, Michal Marcinkowski, through a closed source agreement), including a notable effort from one man known as helloer, there was faith in a possible release of version 1.8 of the game on Steam, with new features such as voice chat and matchmaking. It was thought that such a release, if executed properly, could entice old players back, and give the game a second chance at life.

Unfortunately the work proved to be too much for the small team of volunteers. Instead, a smaller update, version 1.7.1, was pushed to steam. This release gained some traction, and resulted in an increase in the playerbase, but the boost was smaller than was hoped for. Additionally, the game was [open sourced on github](https://github.com/Soldat/soldat) to (hopefully) allow the community to continue the work, and push towards 1.8.

#### Part 2: I meet open source halfway

I caught wind of the open source release a few months after it had happened, and immediately went to check it out. Unfortunately, it seemed that the first challenge would be building the thing. It took me ~8 hours over the course of 2 days, digging around github issues to build Soldat. Not my proudest moment. And, to add insult to injury, when I finally succeeded in building the game, I was greeted by this:

![Soldat with Mesa bug, all textures are either black or red](/res/soldat_mesa_bug.png)

#### Part 3: Open source leads me upstream

Beautiful, eh? But I wasn't about to give up after having spent so much time getting past compile errors. After an hour or two of fruitless debugging myself, I checked the github issues again and found [an issue](https://github.com/Soldat/soldat/issues/18) reporting that Mesa 20.1 had broken Soldat.

Sure enough, downgrading to Mesa 20.0 resolved the issue for me, and Soldat ran fine. So what was the cause of this issue in 20.1? In order to figure it out, I built a debug version of Mesa trunk (which was somewhat challenging on its own) and tried to run Soldat.

Immediately, it crashed with a failed assert statement at `varray.c:684`:

<pre><code class="language-c" data-ln-start-from="684">   assert((int) normalized + (int) integer + (int) doubles <= 1);
</code></pre>

This assert statement checked whether the sum of 3 boolean arguments was less than one. This was in order to check that only one of the conditions was true. When I stepped through the code in a debugger, it was the case that only one of the booleans was true. However, the boolean that was true had a value of 255.

Boolean true in Free Pascal (which Soldat is written in) is simply a bit pattern of all 1s. This gets passed to Mesa without conversion. Because Mesa is written in C, the boolean type `GLboolean` was simply a typedef for `char`. So, the assert statement was triggered by the boolean variable with a value of 255, because (255 + 0 + 0) is obviously greater than 1. The fix for this from Free Pascal was to pass `ByteBool(1)` instead of `True`, so Mesa wound up with a value of 1 for the relevant parameter (the `normalized` parameter of `glVertexAttribPointer`).

I wrote this off as an assumption made by the assert, which likely wouldn't affect the rest of the code. However, after changing the code to work around the assert, Soldat sprang to life again:

![Fixed Soldat](/res/soldat_fixed.png)

It turned out that the boolean value which triggered the assert (`normalized`) was actually being used to calculate an index into a table in `varray.c`:

<pre><code class="language-c" data-ln-start-from="522">   unsigned index = integer*2 + normalized;
   assert(index <= 2);
   assert(type >= GL_BYTE && type <= GL_FIXED);
   return vertex_formats[type - GL_BYTE][index][size-1];
</code></pre>

So because we were passing a value of 255, Mesa was reading way past the end of the table! I made a small patch to Mesa, and sure enough Soldat ran fine. So I made a Merge Request to the Mesa project (Eric Anholt seems chill btw) and the bug was forever vanquished.

#### Conclusions

I can only speak for myself here, but working with bugs, and generally frustration, was an excellent motivator for me. I had a well-defined goal (restoring the original behavior) and the knowledge that my contribution was needed, both in Soldat and upstream. Also, it wasn't some superficial incentive, such as changing a line of documentation or fixing a typo. It was a meaningful bug in software I really care about. And lastly, the Mesa project developers care about their codebase, are responsive, and cordial. All of these things resulted in a pleasant and fulfilling first open source experience. I would love for others to have the same.

