// 영어 문장: 3장 종합 해설 · 특별한 조합 · 연애 타로. 한국어판(synthesis.js, love.js)과 같은 순서·같은 뜻으로 옮겼습니다.
// 각 자리 문장 앞에는 "In your past stood **The Tower**." 같은 첫 문장이 자동으로 붙습니다.

// [과거, 현재, 미래]
const syn = [
  ['A first step taken without weighing everything opened the road you are on.', 'You don’t need to know the destination; take the first step with a light heart.', 'A completely new start is coming, so pack excitement rather than fear.'],
  ['The skills and knowledge you built then have become your tools today.', 'Everything you need is already in your hands, so focus on one thing and act.', 'A chance to turn what you have been imagining into reality is on its way.'],
  ['The intuition you gathered by quietly watching still lives in you.', 'Rather than rushing to an answer, listen to your inner voice.', 'Something is not yet revealed, and you will watch quietly until the time comes.'],
  ['What you tended with care has become a generous foundation.', 'Add beauty to your life and enjoy the fruit of what you have grown.', 'What you have put your heart into returns as an abundant harvest.'],
  ['Setting principles and taking responsibility made you solid.', 'Make a clear plan and lead without wavering.', 'Order takes shape, and you will stand at the center.'],
  ['The teachings you learned and followed became your standard.', 'Follow proven ways and trusted advice rather than a new gamble.', 'You will find a good teacher or a steady shelter, and with it stability.'],
  ['A choice made with your whole heart, and the bond it formed, continue to this day.', 'Cherish the relationship where hearts meet, and choose what your heart points to.', 'A meeting of hearts or an important choice is coming.'],
  ['The will that pushed on without giving up brought you here.', 'If you have chosen your direction, drive forward without hesitation.', 'A day is coming when you clear the obstacles and race toward your goal.'],
  ['The patience that held back anger became your true strength.', 'Guide things gently rather than forcing them, and the situation will follow.', 'You will find yourself unshaken even in the face of difficulty.'],
  ['Time spent alone lit a lamp that is yours alone.', 'Step back from the noise and look at what you truly want.', 'A quiet time to pause and look within is coming.'],
  ['An unexpected turn carried you to where you stand now.', 'The tide is changing, so ride it rather than resist.', 'Unforeseen change and opportunity are coming around.'],
  ['The choices and actions of that time are returning as today’s results.', 'Weigh the facts calmly, decide fairly, and own the outcome.', 'A time of receiving what you have given is coming, so what you do now matters.'],
  ['A pause you could not escape gave you eyes to see the world differently.', 'Even if things seem stuck, don’t force them; change your point of view.', 'A time when you must wait is coming, so prepare to be patient.'],
  ['Something ended painfully, and that made room for a new beginning.', 'Do not cling to what has run its course; let it go.', 'A chapter will close and need clearing away, but that ending touches a new start.'],
  ['The effort not to lean too far taught you how to keep balance.', 'Avoid extremes and find the right pace and measure.', 'What was at odds will find harmony, and your mind will settle.'],
  ['Something you could not let go of held you for a long time.', 'Look squarely at the temptation or attachment that binds you.', 'A sweet but binding temptation is coming, so be on guard.'],
  ['The collapse of something you trusted made you who you are.', 'What is shaking would not have lasted anyway, so accept the fall.', 'Sudden change may strike, so check your weak foundations now.'],
  ['The hope you kept even in the dark lit your way.', 'The wound is healing, and the strength to hope has returned.', 'A time of healing is coming, and light will fall on what you wish for.'],
  ['You came through an anxious night when you could not tell what was real.', 'Nothing is quite clear, so do not rush important decisions.', 'A time when the way ahead blurs is coming; trust your intuition, not only what you see.'],
  ['The warmth of those bright, laughing days still remains in you.', 'This is a bright time with nothing to hide, so rejoice freely.', 'Your efforts will shine in the open, and good news is on its way.'],
  ['A moment of decision that changed your life set your present course.', 'Look back on what has passed and make the decision you have been putting off.', 'Your steps so far will be weighed, and a call to rise anew will come.'],
  ['Seeing something through to the end is an asset you carry.', 'A long journey is reaching completion, so savor what you have achieved.', 'The road you have walked will come together into a whole and complete ending.'],
]

const synRev = [
  ['Leaping in unprepared and losing your way left its mark.', 'Check your footing once more before you jump in on impulse.', 'The pull of a hasty start is coming, so test something small first.'],
  ['There was a time when your talent went unused and plans only circled.', 'Rather than starting many things, choose one and begin today.', 'An offer wrapped in fine words may come, so examine it closely.'],
  ['There was a time you ignored your heart’s signals and were swept along by others.', 'Don’t be swayed by rumor or appearances; take quiet time alone.', 'There may be things not yet shown, so don’t judge in haste.'],
  ['It was a time of caring for others while you yourself ran empty.', 'Fill yourself first, starting with eating and resting well.', 'A tiring stretch is coming, so make room to rest ahead of time.'],
  ['A stubborn need to hold everything clashed with those around you.', 'Open your ears and look for a compromise rather than pressing by force.', 'You may clash with an authoritarian figure, so prepare to be flexible.'],
  ['There was a time when rules set by others did not fit and left you stifled.', 'Question what you have always followed and set your own standard.', 'You will step out of the familiar frame and choose your own path.'],
  ['There was a time when heart and action pulled apart and a gap opened.', 'Before blaming the other, speak your heart honestly.', 'A choice that shakes your heart is coming, so ask yourself now what you truly want.'],
  ['There was a time you sped ahead, lost direction and wandered.', 'Don’t push too hard; decide again where you mean to go.', 'Impatience may cause a collision, so loosen the reins.'],
  ['It was a time of shrinking back, unable to trust yourself.', 'Don’t drive yourself; rest and regain your strength.', 'Feelings you have held back may burst out, so tend to your heart beforehand.'],
  ['There was a time when being alone lasted too long and became isolation.', 'Open the closed door and reach out to one person you trust.', 'Loneliness may deepen, so don’t let go of the people beside you.'],
  ['You came down a slope where effort did not pay off.', 'Don’t cling to what you cannot control; spend your strength on what you can do.', 'A time when things won’t go your way is coming, so postpone big decisions.'],
  ['Something unfair from that time is still unresolved.', 'Stop blaming others and face the uncomfortable facts.', 'Contracts and paperwork may cause trouble, so check them carefully.'],
  ['A long time was spent only holding on and putting off decisions.', 'Waiting alone changes nothing, so untie the rope and move.', 'A pointless sacrifice may be asked of you, so decide what you will let go.'],
  ['There was a time you could not end what needed ending.', 'Set down the lingering attachment and clear away one small thing.', 'You will want to avoid change, but the longer you stay, the longer the standstill.'],
  ['There was a time you leaned too far to one side and lost balance.', 'Cut back what overflows and recover the rhythm of your days.', 'Impatience may spoil things, so slow down.'],
  ['You have known what it is to break a chain that long held you.', 'You now have the strength to break free, so cut it off now.', 'You will be released from what was hard to escape and feel much lighter.'],
  ['You narrowly avoided a collapse, but the cracks remain.', 'Don’t cover the problem; repair and sort it out yourself first.', 'The big shock passes by, but the problem you put off will return.'],
  ['There was a time when repeated disappointment dimmed your hope.', 'Put your heart into one small thing you can do today rather than a big dream.', 'Your drive may fade for a while, but the star is still there behind the clouds.'],
  ['You learned the true shape of a vague fear and walked out of the fog.', 'The fog is lifting, so calmly accept the facts that appear.', 'Misunderstandings will clear and what was hidden will come to light, bringing relief.'],
  ['A regret remains that it was not as bright as you had hoped.', 'Lower your expectations a little and you will see the good already beside you.', 'A happy thing is only a little late, so don’t be discouraged.'],
  ['There was a time you blamed yourself for past mistakes and shut yourself in.', 'Keep only what you learned and forgive yourself; then you can rise again.', 'A moment when you want to avoid deciding is coming, so settle what you have postponed now.'],
  ['Something you nearly completed was left without a final knot.', 'Find the one thing that remains and finish it to the end.', 'The last piece may be delayed, so don’t look for a shortcut.'],
]

const linkPN = {
  '++': 'Carrying that good current forward,',
  '+0': 'Setting that momentum down for a while,',
  '+-': 'But unlike those bright days,',
  '0+': 'With that time as your footing,',
  '00': 'Following on from that,',
  '0-': 'Since then the current has grown heavier, and',
  '-+': 'Having come through that hard time,',
  '-0': 'With that storm settled,',
  '--': 'With its echo still lingering,',
}

const linkNF = {
  '++': 'If you carry this energy with you,',
  '+0': 'If you calmly refine this strength,',
  '+-': 'But do not let today’s ease make you careless.',
  '0+': 'Once you have tended to the present,',
  '00': 'If you keep walking calmly, one step at a time,',
  '0-': 'Steady your heart now, in advance.',
  '-+': 'Once you have endured the present difficulty,',
  '-0': 'Once this season has passed,',
  '--': 'The hard current continues, but it does have an end.',
}

const close = {
  '+': 'Leelmell sees your path turning toward the good. The time behind you was not wasted, and what you build now will become the ground for what comes next. Rather than getting carried away, keep calm and trust the steps you are taking. Good fortune stays longer with those who are ready.',
  '0': 'Leelmell sees your path quietly choosing its direction. It is all right if the answer is not clear yet. Just as muddy water clears when left still, the way will show itself once your heart settles. There is no need to hurry; start with one small thing you can do today.',
  '-': 'Leelmell sees a hill ahead that you must climb. But knowing it now, you can prepare. Rather than forcing your way through, save your strength, and it is fine to ask the people beside you for help. Once you are over the hill, you will find a stronger version of yourself.',
}

// SPECIAL_ORDERED 와 같은 순서
const ordered = [
  '**The Star** follows **The Tower**. This is the most comforting sequence in tarot: healing arrives where something fell. Look to what will be filled rather than what was lost.',
  '**Judgement** follows **Death**. What ended rises again in a new form. As much as you have cleared away, you can begin anew.',
  '**The Sun** follows **Death**. A long night ends and a new morning breaks. You need not fear the ending.',
  '**The Tower** follows **The Devil**. What you could not let go of finally bursts. Setting it down yourself before it falls hurts less.',
  '**The Tower** follows **The Sun**. It warns of sudden change at the brightest moment. The smoother things go, the more you should check your foundations.',
]

// SPECIAL_PAIRS 와 같은 순서
const pairs = [
  '**The Sun** and **The World** appear together. This is the pairing of greatest achievement and completion among the 22 cards. What you hoped for comes fully true, so rejoice.',
  '**The Star** and **The Sun** appear together. Hope you have held becomes real. A time of healing leads into joy.',
  '**The Lovers** and **The Sun** appear together. Love bears fruit in the open. It is a good time to share your heart without hiding.',
  '**The Empress** and **The Emperor** appear together. They are a pair that completes each other, meaning a stable home and a steady partner. Warmth and firmness are in balance.',
  '**The Lovers** and **The Empress** appear together. Love bears fruit; it can also mean marriage or news of new life.',
  '**The Magician** and **The World** appear together. What you set out to do is carried through to the end. You have the power to complete what you began.',
  '**Wheel of Fortune** and **The Sun** appear together. This pairing marks a turning point where luck returns. Do not miss the chance that comes.',
  '**The Fool** and **The World** appear together. The first and last of the 22 cards have met. One journey completes and a new one begins.',
  '**The Tower** and **Death** appear together. This is the heaviest pairing of the 22 cards, meaning a great change that cannot be avoided. Accept rather than cling, and prepare for the new start that follows.',
  '**The Devil** and **The Tower** appear together. Attachment and temptation invite collapse. Look now at what binds you.',
  '**The Moon** and **The Devil** appear together. Beware of deception and of fooling yourself. The sweeter the words, the more you should check the facts.',
  '**The Lovers** and **The Devil** appear together. The two cards share the same composition, and warn against love turning into possession. Protect each other’s freedom within the relationship.',
  '**The Tower** and **The Moon** appear together. It is a pairing of being shaken amid confusion. Postpone big decisions until the facts are clear.',
  '**The Hanged Man** and **The Moon** appear together. You are paused with no path in sight. Do not be impatient; wait for the fog to lift.',
]

const pattern = {
  run: 'The three cards came in numerical order. It is a rare layout in which the journey unfolds one step after another. The current you are in is not chance but a single thread.',
  allRev: 'All three cards came reversed. It is a rare layout that tells you to look within rather than push outward. Slow down and set things right one at a time.',
  allBright: 'All three are bright cards. It is a rare layout in which good energy runs unbroken from past to future.',
  allTrial: 'All three are cards of trial. It is a rare and heavy layout, but tarot is not trying to frighten you; it is telling you to prepare.',
}

// 연애 타로: [나의 마음, 상대의 마음, 장애]
const love = [
  ['You feel a flutter without calculation and want to begin something new.', 'They look at you with light, free curiosity; it is a pure attraction not yet weighed.', 'It is a lightness that does not think ahead; one of you is not ready for promises and responsibility.'],
  ['You have the will to do whatever it takes to win their heart.', 'They are putting care into their words and actions to impress you.', 'It is smooth talk; when technique comes before sincerity, trust cannot grow.'],
  ['You are quietly watching them without showing it.', 'They do not show their heart easily, but they are watching you deeply.', 'It is the unspoken; you both guess instead of asking, and distance grows.'],
  ['Yours is a generous love that wants to give freely and care warmly.', 'They feel at ease beside you and want to look after you tenderly.', 'It is too much care; looking after someone can feel like interference to them.'],
  ['You want to take responsibility for this relationship and protect it firmly.', 'They take you seriously and want to build something stable.', 'It is a struggle for control; one deciding and one following leaves no room to breathe.'],
  ['You value promises and trust, and want a relationship that is properly recognized.', 'They see you as someone to trust and mean to treat you with courtesy and sincerity.', 'It is convention and the eyes of others; fitting their standards pushes your own hearts aside.'],
  ['You are deeply drawn, and clearly want to choose this person.', 'They are strongly drawn to you and feel that your hearts connect.', 'It is a fork in the road; a heart split two ways cannot settle on one.'],
  ['You have a burning drive to approach without hesitation.', 'They mean to come toward you actively; once decided, they move at once.', 'It is too much speed; one runs so fast the other cannot keep up.'],
  ['Yours is a steady affection that can wait gently without rushing.', 'Theirs is a patient heart that would embrace even your rough edges.', 'It is enduring in silence; if one side only bears it, they will wear out.'],
  ['You need time alone and want to confirm your feelings slowly.', 'They think of you but cannot come close easily; they are sorting out their heart alone.', 'It is distance; each stays in their own cave too long for hearts to meet.'],
  ['You feel this meeting as fate and are leaving your heart to the current.', 'They feel your bond is no accident, though their heart moves with the tide.', 'It is timing; the feeling is there, but your moments keep missing each other.'],
  ['You want a fair and honest relationship where giving and receiving match.', 'They are weighing you carefully, asking whether this relationship is right more than how it feels.', 'It is keeping score; once you start counting who did more, love cools.'],
  ['You have feelings but cannot move, and are willing to wait for them.', 'Circumstances keep them from approaching now; their heart is on hold.', 'It is stopped time; no one moves first, and the relationship stays tied in place.'],
  ['You want to end the old way of relating and change completely.', 'They are clearing something out inside, feeling the relationship cannot stay as it is.', 'It is attachment to what has ended; a past relationship or an old image blocks a new start.'],
  ['Yours is a calm heart that wants to deepen slowly while adjusting to each other.', 'They are trying to match your pace and want an easy, harmonious relationship.', 'It is too much caution; in always adjusting, neither says what they truly want.'],
  ['You are drawn so strongly you cannot let go, and some possessiveness is mixed in.', 'They are intensely drawn to you, though there is a wish to possess in it.', 'It is obsession and jealousy; trying to bind each other makes love heavy.'],
  ['Your heart is badly shaken; something you trusted has broken and you are confused.', 'Something unexpected has shaken them, and they cannot yet gather their feelings.', 'It is a suddenly revealed truth; a hidden problem has burst and trust is shaking.'],
  ['You purely hope this love will go well.', 'They look at you with hope; it is an unadorned, honest fondness.', 'It is expectations set too high; gazing at an ideal, you miss the person in front of you.'],
  ['You are anxious without certainty and keep imagining what they feel.', 'Their feelings are unclear; they may not know their own heart, or have left something unsaid.', 'It is misunderstanding and anxiety; unchecked guesses are growing as if they were facts.'],
  ['You like them openly and are simply happy to be together.', 'They enjoy being with you and feel at ease; it is a bright fondness shown honestly.', 'It is too much optimism; believing all will be fine hides what needs attention.'],
  ['You want to reach a clear conclusion about this relationship.', 'They are rethinking the relationship; if it is a past bond, they may reach out again.', 'It is judgment of the past; an old wrong has not yet been forgiven.'],
  ['You feel so full that with this person you would want nothing more.', 'They feel whole with you and see you as someone to stay with for a long time.', 'It is the ease of thinking everything is achieved; once it feels complete, you grow careless with each other.'],
]

const loveRev = [
  ['You want to approach but hesitate for fear of being hurt.', 'They are taking it lightly, or stepping back out of fear of something deep.', 'It is irresponsibility; impulsive words and actions are wearing away trust.'],
  ['You have feelings but circle around, not knowing how to show them.', 'Their words and actions differ; they are not showing you all of their heart.', 'It is a lie or a hidden motive; check what lies behind the pleasant words.'],
  ['You are trying not to notice what your intuition is telling you.', 'They have closed off their feelings and may be hiding something.', 'It is secrets and rumor; you are judging by others’ words instead of asking directly.'],
  ['You are tired of only giving and now want to receive.', 'They want to lean on you but have no room to care for themselves.', 'It is dependence; one side’s leaning wears the other out.'],
  ['You are frustrated that things won’t go your way and want to control them.', 'They insist on their own way and are stiff and clumsy at showing feelings.', 'It is stubbornness and control; one of you tries to decide everything.'],
  ['You want to love in your own way, whatever others say.', 'They find it a burden to be tied to fixed forms or promises.', 'It is different values; your ideas about relationships differ at the root.'],
  ['Your heart is wavering; you are not sure this is the right person.', 'Their heart is not what it was, or they are weighing other options.', 'It is hearts out of step; you want different things and conversation skims the surface.'],
  ['The wish to approach and the wish to retreat are fighting in you.', 'Unable to choose a direction, they keep coming close and pulling away.', 'It is crossed directions; the two of you are pulling toward different places.'],
  ['You are shrinking back, unsure you deserve to be loved.', 'They lack the confidence to approach first and are worn out by their feelings.', 'It is built-up feeling; hurt held back may burst out all at once.'],
  ['You are lonely but afraid to open the door of your heart.', 'They have shut themselves in their own world and are not letting you in.', 'It is isolation; one of you cuts off contact and hides.'],
  ['You are upset, wondering why your love never goes your way.', 'Circumstances are not helping, and they are about to give up.', 'It is bad timing; outside circumstances are not on your side right now.'],
  ['You feel wronged, as if you alone are losing out.', 'They do not admit their faults, or are not treating the relationship fairly.', 'It is unfairness; one only gives and one only receives.'],
  ['You are tired of waiting but cannot let go either.', 'They keep putting off a decision and leave you waiting.', 'It is waiting with no end in sight; no one makes a decision.'],
  ['You know it is over, yet cannot let go.', 'They have not yet settled a past relationship or feeling.', 'It is an unfinished past; a former person or an old wound remains between you.'],
  ['Your feelings have tilted to one side and you have lost your balance.', 'They run hot and cold; their feelings swing widely.', 'It is mismatched pace; one hurries and one delays.'],
  ['You want to be free of attachment and feel lighter.', 'They are letting go of their grip on you and looking for a healthy distance.', 'It is a bad habit not yet broken; you are getting free but could be pulled back.'],
  ['The worst shock has passed, but unease remains.', 'They know the problem but keep it covered for fear it will blow up.', 'It is a covered-up problem; it was only left unsaid, not gone.'],
  ['After hoping and being let down again and again, your hope has dimmed.', 'They have lost a little of their hope for this relationship and are guarding their heart.', 'It is lost faith; on one side, the belief that it will work has cooled.'],
  ['You have learned what your vague anxiety really was, and your heart is settling.', 'They are about to reveal what they hid; a misunderstanding may clear.', 'It is a misunderstanding being cleared; sweep away the remaining doubt with honest talk.'],
  ['You like them, but miss the thrill you used to feel.', 'They like you but show it less; their heart has not cooled, it is tired.', 'It is fading expression; while you took each other for granted, the joy shrank.'],
  ['You blame yourself for past mistakes and feel you have no right to start again.', 'They regret what happened but cannot bring it up first.', 'It is something unforgiven; the same story keeps repeating.'],
  ['You are almost there, but the last certainty will not come.', 'They hesitate to take the relationship to the next stage.', 'It is a last step left untied; a promise or decision keeps being postponed.'],
]

const hearts = {
  '++': 'Both hearts are turned the same way.',
  '+0': 'You are approaching while they watch; there is a difference in warmth.',
  '+-': 'Your heart is open, but theirs is heavy.',
  '0+': 'They are coming toward you first, while you are still watching.',
  '00': 'Both of you are carefully studying each other.',
  '0-': 'You are watching, and their heart is uneasy.',
  '-+': 'Their heart is open, but yours is heavy.',
  '-0': 'While your heart is heavy, they are quietly waiting.',
  '--': 'Both of your hearts are worn out.',
}

const block = {
  '+': 'If you get past this obstacle together,',
  '0': 'Once you have faced this obstacle,',
  '-': 'If this obstacle is left as it is,',
}

const closeLove = {
  '+': 'Ulyooum sees the two of you heading somewhere warm. Your hearts are ready to meet, so rather than hesitating, tell them honestly how you feel. A small word and a kind gesture will bring you closer. A good bond grows stronger the more you cherish and show it.',
  '0': 'Ulyooum sees the two of you still choosing a direction. It is not a lack of feeling; you are carefully reading each other. Instead of rushing or pressing for an answer, keep the conversation easy and open. Trust built slowly will show you clearly where to go together.',
  '-': 'Ulyooum sees a hill ahead for the two of you. But now that you know, you can prepare for it together. Rather than guessing alone and feeling hurt, open up and talk it through. Once you cross this hill together, you will understand each other more deeply.',
}

const pos = ['My heart', 'Their heart', 'Past', 'Present', 'Obstacle', 'Ahead']

export const EN = { syn, synRev, linkPN, linkNF, close, ordered, pairs, pattern, love, loveRev, hearts, block, closeLove, pos }
