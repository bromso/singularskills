# Prompt and context design

How the AI skills design what the model is told and what it is given. Prompts are code: versioned, reviewed and evaluated on every change.

## Instructions and untrusted input

- Keep **instructions** (what the model must do) apart from **untrusted input** (anything a user typed, any retrieved document, any tool result). Put untrusted input in clearly delimited blocks and tell the model that text inside them is data, never instructions.
- State the job, the audience, what a good answer contains, and what to do when the answer is not in the context.
- Give two or three examples of good outputs for typical inputs, and one for an input the feature should decline.
- Specify the output format exactly (sections, length, JSON schema) so plain checks can verify it.
- Tell the model how to behave when unsure: say so, ask a clarifying question, or hand over to a person, never guess.

## Context and retrieval

- Retrieve only what the job needs. Split documents into chunks that keep a heading with its text, and rank them for the request.
- Ask the model to cite the source of each claim, and show those sources to users.
- Decide what happens when nothing relevant is retrieved: say so and offer a next step, never answer from general knowledge as if it came from the documents.
- Count the context: long contexts cost more, are slower, and can bury the instruction that matters.

## Prompt injection

A model cannot reliably tell instructions from data, so any text it reads can try to take control.

- **Direct injection**: the user's message tries to override the instructions ("ignore your rules and…").
- **Indirect injection**: instructions hidden in **retrieved** documents, web pages, emails or tool results, which the user may never see. A retrieval or tool-using feature is exposed even when every user is honest.

Defences, layered because none is complete:

- Untrusted input kept apart from instructions, as above.
- **least privilege** for tools: the model gets only the tools and data the job needs, with the narrowest permissions.
- **Confirmation** before any action with side effects (sending, deleting, paying, changing records).
- **Output checks**: block outputs that contain secrets, personal data or links the feature should never produce.
- Attack tests before launch and after every change (`/ai-red-team`).

## Hallucination

Hallucination is fluent output that is wrong or unsupported. It comes in two broad kinds: *factuality* errors (contradicting the world) and *faithfulness* errors (contradicting the instructions or the supplied context) (Huang et al., 2023, *ACM Transactions on Information Systems*: "A Survey on Hallucination in Large Language Models"). Retrieval with cited sources reduces both but does not remove them, which is why evaluation reads real outputs.

## Why this needs a process

Prompt design is often treated as trial and error, which makes outputs inconsistent and sensitive to small wording changes (Debnath et al., 2026, *Computer Science Review*: "A comprehensive survey of prompt engineering and context engineering techniques in large language models"). And effort moves from producing output to checking it: developers report discarding generated output and spending their time verifying (Tabarsi et al., 2025, *Empirical Software Engineering*). Writing the design down, and evaluating every change, is what keeps both costs down.
