# Personal portfolio

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The user delegated stack selection to the assistant based on project fitness and sound engineering, without adding technology for its own sake.

Selected: Astro static output, strict TypeScript, direct Three.js for the explorer, scoped custom CSS with shared CSS variables, and Markdown content collections. Node LTS/npm builds the site. GitHub Pages and GitHub Actions are the intended hosting and delivery tools. Playwright will check meaningful browser interactions.

The foundation installs only the tools it currently uses. Three.js and browser test dependencies enter with their implementation slices. No React, Tailwind, state library, general animation library, server, or database is needed initially. See `docs/architecture.md` for rationale and reconsideration triggers.

## Users

Hiring managers and engineers reviewing the owner's work before contacting them.

## Product Purpose

Present the owner's backend engineering, AI/ML, and data science focus through a distinctive portfolio and accessible project exploration.

## Capabilities and Constraints

- Outer-space theme with a visibly twinkling star background.
- A rotatable solar system is the main visual element within a complete portfolio website.
- Visit a planet: animate toward it and show a readable project description beside a close view.
- Land: open that project's real demo. Offer an honest source/walkthrough action when no live demo exists.
- Return to the system predictably; support direct project links and browser Back.
- Keep project content interchangeable without changing scene logic or page components.
- Feature the owner's pinned projects once their account and current selection are verified. Do not block the design foundation on final copy.
- Work iteratively. The current authorization is the phased plan and scaffold, not the entire finished site.
- Use the Stitch composition as the starting structure, incorporating the requested explorer additions. Do not restart layout discovery as though there is no reference.
- Keep maintenance and hosting lean; avoid generic portfolio templates.

## Brand Commitments

The supplied Stitch reference establishes the dark space direction, restrained violet/cyan accents, thin orbital geometry, and portfolio composition. Custom authorship comes from deliberate typography, composition, motion, and interaction. Choosing CSS over Tailwind does not itself create originality.

## Evidence on Hand

- Original extracted Stitch files: `references/stitch/`.
- Earlier comparison: `references/interaction-studies/explorer-comparison.html`.
- User selected rotational navigation after the comparison.
- User said the comparison's star twinkle was not working. Treat the visual effect as unresolved, not approved.
- Confirmed focus, audience, and contact outcome above.
- Exported name, employment, projects, metrics, and contact details are not verified biography or publication-ready content.

## Product Principles

- Make the interaction memorable and the work easy to inspect.
- Keep reading and contacting possible without navigating a scene.
- Let content change independently from presentation.
- Review small visual and interaction slices before extending them across the site.

## Open Decisions

- Final planet style, typography, star density/intensity, and motion pacing.
- Responsive adaptation and exact placement of the visit view within the reference composition.
- Final project identifiers/content, verified source and demo URLs, resume, and contact links.
- Repository identity/visibility, domain, hosting path, and initial publication.

The architecture direction and phased development method are settled. The foundation shell is not a new visual proposal or an approved finished design.
