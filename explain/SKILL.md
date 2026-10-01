---
name: explain
description: Explain a solution, bug, design or concept the Feynman way — one concrete picture carried all the way through, the tempting wrong answers and why they fail, no jargon without a plain-word twin, an honest section at the end — rendered in Vietnamese in the prose voice of Phạm Văn Thiều (translator of Lược sử thời gian, Niềm vui khám phá), and published as a chalkboard-style Artifact page. Use whenever the user says "/explain", "giải thích", "giải thích dễ hiểu", "giải thích kiểu Feynman", "explain this simply", "explain like Feynman", "làm trang giải thích", "giải thích cho sếp / cho team / cho đồng nghiệp", "để tôi trình bày", or wants a non-engineer to understand a technical thing. Pass "en" or "tiếng Anh" to get the English version (for meetings with foreign colleagues); Vietnamese is the default.
argument-hint: "[topic or ticket] [en]"
---

# Explain

The user has a technical thing (a fix, a design, a bug, a mechanism) and wants someone
else to *get it* — a manager, a PM, a teammate from another area, or the user's own
future self before a meeting. Not a spec. Not a summary. An explanation that makes the
reader see the mechanism, so the code afterwards looks obvious.

Two people guide the writing:

- **Richard Feynman** decides *what to say and in what order* (content, structure, honesty).
- **Phạm Văn Thiều** decides *how it sounds in Vietnamese* (prose, word choice, rhythm).

Default language is Vietnamese. If the user says `en`, `tiếng Anh`, or the audience is
plainly non-Vietnamese, write English and keep only the Feynman half. If the user says
`song ngữ`, `both`, `bilingual`, or the page will be read by both Vietnamese and foreign
colleagues, build one page with both: two `<main data-lang="vi|en">` blocks, a VI/EN pill
in the top-right, root `data-lang` switches which one shows, choice remembered in
`localStorage` inside try/catch, Vietnamese shown first. `example.html` is built this way.

## 0. Gather before you write

Feynman never explained what he had not first understood in full. Before drafting:

1. Read whatever the conversation already established: the ticket folder's `memory.md`,
   notes, the comment posted on the ticket, the code the explanation is about. Do not re-investigate what is
   already settled; do not invent facts the record does not hold.
2. Write down, privately, three things in one line each:
   - the **real problem** (usually not the one in the ticket title),
   - the **one idea** that solves it,
   - the **one place the design is weak** (you will say it out loud in section 7).
3. Pick **one picture** from ordinary life that has the same *shape* as the mechanism.
   Not a decoration — a working model the reader can reason with. Test it: every step of
   the real solution must map onto a step in the picture. If a step has no counterpart,
   the picture is wrong; pick another. Good pictures come from the subject's own world
   (mail, keys, house numbers, ledgers, queues, tickets), never from "imagine a magic box".

If you cannot state the real problem in one sentence, stop and investigate; an
explanation built on a fuzzy problem is fog with nice typography.

## 1. The Feynman half (content, any language)

- **Start with the picture, not the system.** First paragraphs are the everyday model.
  The real names (services, tables, tokens) enter only after the reader can already
  predict the bug from the picture.
- **The bug is one sentence.** "The post office was never asked *whose* number 42."
  If it takes three, you have not found it yet.
- **Show the tempting fixes and kill them.** Two or three ideas the reader would have had
  themselves, each with the concrete way it fails, in the picture's terms. This is what
  earns trust: the reader sees you tried their idea first.
- **Name the pattern behind the failures** in one line. ("Every fix that stores *whose*
  somewhere a clone can copy is doomed.") That line is the pivot to the solution.
- **The trick is one move.** Say where the answer *must* live and why only there. Then
  the mechanism, as a short numbered procedure — numbered only because order matters.
- **What happens to the people who worry.** A section addressed to the actual audience's
  actual fear (production, customers, deadline), answered plainly, ideally with a small
  table of who feels what.
- **Cost, honestly, in one paragraph.**
- **"Things I want to be honest about."** The weak spots, unknowns, and costs that exist
  in *every* design, listed as question + answer. Feynman: "The first principle is that
  you must not fool yourself — and you are the easiest person to fool." An explanation
  with no honest section is a sales pitch.
- **Close with one line that holds the whole thing**, in the picture's language.
- **No jargon without a plain-word twin** on first use. Real identifiers (realm names,
  column names, endpoints) appear in `code` and stay in their original language.
- **First person, present tense, talking to one person.** "I want to show you", "look at
  this", "here is the whole trouble". Feynman's humour is allowed, is short, and is never
  at the reader's expense.
- **Numbers only when they change a decision.** One repo vs twelve is worth saying; the
  exact count of call sites is a footnote.

## 2. The Phạm Văn Thiều half (Vietnamese prose)

Phạm Văn Thiều, physicist, three-time Giải thưởng Sách Quốc gia, translator of *Lược sử
thời gian* (with Cao Chi), *Giai điệu dây và bản giao hưởng vũ trụ*, *Niềm vui khám phá*
(Feynman, with Đặng Đình Long). His stated creed: "Khoa học vẫn có thể đầy chất thơ" and
"thứ tiếng Việt thuần khiết và trong sáng nhất". He also repeats Hawking's publisher's
rule: mỗi công thức thêm vào là mất một nửa bạn đọc.

Write Vietnamese that a science-literate reader would take for a good book, not for a
translated spec:

- **Tiếng Việt trước, Hán Việt sau, calque không bao giờ.** "cách làm" not "phương
  thức thực hiện"; "hộp thư" not "mailbox entity"; "cho nên" not "do đó"; "hoá ra" not
  "kết quả là". A Sino-Vietnamese term is fine when it *is* the everyday word (vũ trụ,
  hệ thống); it is wrong when it exists only to sound technical.
- **Banned calques and bureaucratese** (rewrite on sight): "một cách + adj", "được ... bởi",
  "có thể được", "điều này có nghĩa là", "trong trường hợp", "về cơ bản", "việc thực
  hiện", "tiến hành", "đối với", "nhằm mục đích", "bên cạnh đó", "tuy nhiên," at the start
  of every second sentence, "một số", "các" stacked on plurals that need no marker.
- **Nhịp câu của người kể chuyện.** A long sentence that walks the reader through a
  thought, then a short one that lands it. Vary; never three long in a row. Read every
  paragraph aloud in your head; if you run out of breath, split.
- **Xưng "tôi", gọi "bạn".** Never "chúng ta cần" as a hedge, never "người dùng", never
  the passive "được đề xuất". When Feynman says "look", Thiều writes "bạn hãy nhìn xem",
  "thế này nhé", "hoá ra là", "nói cho cùng".
- **Giữ cái cười của tác giả.** Feynman's jokes survive translation only when rendered
  as a Vietnamese joke, not a literal one. If it does not land in Vietnamese, cut it.
- **Thuật ngữ**: on first use, Vietnamese gloss + the original in parentheses when the
  original is a real identifier the reader will meet in the UI or code: "vùng (realm)",
  "mã định danh (GUID)". Afterwards use the form the reader will actually type or see.
- **Ẩn dụ xuyên suốt, không đổi giữa chừng.** One picture from title to last line.
  Section headings live inside the picture too ("Hai thị trấn, một bưu điện", "Cái mẹo").
- **Chất thơ ở chỗ hiếm.** One or two lines in the whole piece may lift — the pivot line,
  the closing line. Everywhere else, plain and exact. Poetry sprinkled everywhere is
  noise.

Rhythm reference (opening of *Lược sử thời gian*, Cao Chi – Phạm Văn Thiều; quoted from
memory, for cadence, not for citation):

> Một nhà khoa học nổi tiếng (hình như là Bertrand Russell) một lần đọc trước công chúng
> một bài giảng về thiên văn học. Ông đã mô tả trái đất quay quanh mặt trời như thế nào
> và đến lượt mình, mặt trời lại quay quanh tâm của một quần thể khổng lồ các vì sao
> (mà người ta gọi là thiên hà của chúng ta) ra sao. Khi bài giảng kết thúc, một bà già
> nhỏ bé ngồi ở cuối phòng đứng dậy và nói: "Anh nói với chúng tôi toàn những điều nhảm
> nhí. Thế giới thực tế là một cái đĩa phẳng tựa trên lưng một con rùa khổng lồ." Nhà
> khoa học mỉm một nụ cười hạ cố trước khi trả lời: "Thế con rùa ấy tựa lên cái gì?"
> "Anh thông minh lắm, anh bạn trẻ ạ, anh rất thông minh," bà già nói, "nhưng những con
> rùa cứ xếp chồng lên nhau mãi xuống dưới, chứ còn sao nữa!"

Notice: a parenthetical aside that keeps the voice warm, "hình như là", "chứ còn sao
nữa", dialogue kept alive, one long descriptive sentence then short punches. That is the
register.

Mini example of the same content in the wrong and right register:

- Wrong: "Việc thực hiện migration được xác định bởi GUID một cách không chính xác, do đó
  dẫn đến việc dữ liệu được ghi vào realm của môi trường khác."
- Right: "Khi chạy migration, hệ thống chỉ hỏi dịch vụ đăng nhập một câu: 'có vùng tên 42 chưa?'
  Có rồi. Thế là nó ghi cả người dùng của mình vào cái vùng ấy, mà cái vùng ấy là của
  Acceptance. Chẳng ai nói dối cả. Chỉ là chưa từng có ai hỏi: 42 *của ai*?"

## 3. Structure of the page

Sections, in this order, each heading phrased inside the picture. Skip a section only
when it is genuinely empty (a pure concept explainer has no "cost" section).

1. Eyebrow (ticket / topic) · Title = the picture ("Two Towns, One Post Office" / "Hai
   thị trấn, một bưu điện") · a two-sentence lede saying what the reader will be able
   to see afterwards.
2. **The picture** — the everyday model, then the bug told inside it. One chalk diagram.
3. **The tempting fixes** — 2–3 items, each ✗ + one concrete failure. Pivot line as a
   margin note.
4. **The trick** — where the answer must live, the one move. Second chalk diagram (after).
5. **How the machine runs** — numbered procedure, 3–5 steps. Fail-loud rule if any.
   A margin note with the Feynman "don't fool yourself" line when a fallback was rejected.
6. **What happens to <the audience's worry>** — table: where / what we do / who feels it.
7. **What it costs** — one paragraph.
8. **Things I want to be honest about** — dt/dd list.
9. Closing line + a small caption.

Target length: 900–1400 words in the body language. A meeting reader finishes it in
six minutes.

## 4. Design (chalkboard)

Load `artifact-design` first, as always. Then use this identity unless the user asks for
another — it is the Feynman lecture hall and the reader recognises it instantly:

- Single-theme, committed: board `#1e2a25`, chalk `#ece7d8`, dim chalk `#b9b4a5`,
  yellow chalk `#f0c75e` (emphasis, headings' underline, numbers), pink chalk `#e79a9a`
  (wrong answers, warnings), blue chalk `#9cc6d8` (`code`), green chalk `#a6d29a`
  (the one "this is safe" annotation). Paint `body` background explicitly; set
  `color-scheme: dark`.
- Type: **Caveat** 700 for h1/h2/margin notes/figure captions (handwritten chalk),
  **Literata** for body (a book, because Thiều's readers hold a book), **IBM Plex Mono**
  for identifiers and small labels. Google Fonts link, real fallback stacks.
- h1 tilted −1°, margin notes tilted −0.4° with a left chalk rule: things written by hand
  in the margin. Nothing else tilts.
- Diagrams: inline SVG, 2px chalk strokes, rounded caps, hand-lettered labels in Caveat,
  mono captions. Before/after pairs use the same composition so the eye sees the diff.
- Body measure 68ch, 17px/1.6. Sections separated by space and a short yellow underline
  under h2, not by cards. The only boxed things are the mailboxes in the drawings.
- Honest section as `<dl>`; migration table with mono uppercase headers; wrong-answer list
  with a pink ✗ gutter; procedure list with big yellow Caveat numerals.
- `prefers-reduced-motion` respected; the only motion is the h1 settling in on load.

Publish with the Artifact tool. Favicon: pick one emoji that is the picture (📮 for the
post office), keep it on republish. `<title>` = the picture's name only.

## 5. Self-check before publishing

- Can the reader predict the bug from the picture alone, before any system name appears?
- Does every step of the real mechanism have a counterpart in the picture?
- Did I kill at least two tempting fixes with a *concrete* failure each?
- Is there a section addressed to the audience's actual fear?
- Is the honest section real (a thing that could go wrong), not a humble-brag?
- Vietnamese: zero banned calques (grep the list), "tôi"/"bạn" throughout, terms glossed
  once, one picture only, at most two lifted lines.
- No number in prose that does not change a decision.

## 6. Reply in chat

Three or four lines: the link, the picture in one sentence, the one honest weak spot,
and the source file path. The user is often about to walk into a meeting; do not make
them read the explanation twice.

