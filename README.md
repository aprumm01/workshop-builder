# Workshop Builder

An automated workshop planning tool for facilitators. Design better workshops with structured guidance, intelligent activity recommendations, and professional reports.

## Features

- **Guided Workshop Design**: Answer questions about your workshop goals, team size, and constraints to receive a customized workshop plan
- **4 Workshop Templates**: Pre-configured templates for Strategy, Iteration, Product, and custom workshops
- **10 Core Exercises**: Curated activities based on proven workshop frameworks
- **Drag-and-Drop Builder**: Customize your workshop timeline with an intuitive interface
- **Smart Recommendations**: Activity suggestions based on workshop type, team size, and available time
- **4C's Framework**: Ensure your workshop covers Collect, Choose, Create, and Commit phases
- **Printable Reports**: Generate professional workshop plans with agendas, timings, and materials lists
- **No Backend Required**: Runs entirely in the browser with localStorage persistence

## Getting Started

1. Visit the [Workshop Builder](https://yourusername.github.io/workshop-builder/)
2. Choose your workshop type (Strategy, Iteration, Product, or Anything Goes)
3. Complete the guided questionnaire
4. Review the recommended workshop structure
5. Customize in the builder
6. Generate and print your workshop plan

## Workshop Types

- **Strategy**: Vision setting, goal alignment, and strategic planning (typically 2+ days)
- **Iteration**: Sprint planning, retrospectives, and iteration reviews (typically 1 day)
- **Product**: Product discovery, feature design, and prototyping (typically 3+ days)
- **Anything Goes**: Custom workshops with full control

## The 10 Core Exercises

1. **Expert Interview** - Capture context from stakeholders
2. **10 for 10** - Rapid ideation with quick sketches
3. **Sailboat Retrospective** - Visual metaphor for team reflection
4. **Lightning Demos** - Research and inspiration gathering
5. **User Story Mapping** - Feature prioritization and planning
6. **Map** - Spatial organization of ideas
7. **Long Term Goal & Key Questions** - Vision and strategy alignment
8. **Concept Creation** - Detailed solution design
9. **Action Board (1-3-5 Breakdown)** - Post-workshop action planning
10. **Storyboard** - User experience visualization

## Local Development

Since this is a static site with no build process:

1. Clone the repository
2. Open `index.html` in a browser, or
3. Use a local server: `python -m http.server 8000`

## Project Structure

```
workshop-builder/
├── index.html              # Landing page
├── questionnaire.html      # Guided questionnaire
├── recommendation.html     # Workshop recommendation
├── builder.html           # Interactive builder
├── report.html            # Printable report
├── library.html           # Exercise reference
├── css/
│   ├── styles.css         # Global styles
│   ├── questionnaire.css  # Questionnaire styles
│   ├── recommendation.css # Recommendation styles
│   ├── builder.css        # Builder styles
│   └── report.css         # Report styles
├── js/
│   ├── storage.js         # localStorage management
│   ├── app.js            # Landing page logic
│   ├── questionnaire.js   # Questionnaire logic
│   ├── recommendation.js  # Recommendation logic
│   ├── builder.js         # Builder logic
│   └── report.js          # Report generator
└── data/
    ├── exercises.json     # Exercise database
    └── templates.json     # Workshop templates
```

## Data Persistence

Workshop plans are saved to browser localStorage. Export your workshop as JSON to share or back up.

## Future Enhancements

- Custom template creation and sharing
- Exercise library page
- Multi-week workshop scheduling
- Collaborative planning features
- Integration with calendar apps

## License

MIT License - feel free to use and modify for your facilitation needs.

## Contributing

Contributions welcome! Please open an issue or PR.
