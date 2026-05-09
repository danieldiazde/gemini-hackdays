# Product direction

The project direction is **TecCoach**.

Earlier generic Gemini ideas were discarded. Do not build the dynamic dashboard or robotics simulation scaffold unless the product direction changes again.

## Active idea

TecCoach is an academic coach for Tec de Monterrey students. It uses Gemini API to analyze a student's Tec profile, current classes, Canvas deadlines, and Google Calendar availability, then returns structured weekly study priorities and study-block recommendations.

## Why this direction

- It is specific to the Tec student experience.
- It gives Gemini concrete structured context instead of a generic prompt.
- It has a clear end-to-end demo: sign in, onboard, generate insights, approve blocks, write to Google Calendar.
- It differentiates through Tec21 context such as Semanas Tec, life courses, and block-based planning.

## Source of truth

- Product brief and contracts: [`../../PROJECT.md`](../../PROJECT.md)
- Implementation overview: [`../../README.md`](../../README.md)
- Architecture: [`../architecture/system-design.md`](../architecture/system-design.md)
