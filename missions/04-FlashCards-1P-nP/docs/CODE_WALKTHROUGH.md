# FlashCards Code Walkthrough

```mermaid
flowchart TD
    A["decks object stores questions"] --> B["showCard() displays one card"]
    B --> C["checkAnswer() compares input"]
    C --> D["Correct: streak increases"]
    C --> E["Wrong: streak resets"]
    D --> F["submitScore() posts streak"]
```

## Main Ideas
| Function | Student-Friendly Meaning |
| --- | --- |
| `currentDeck()` | Picks the active deck from the dropdown. |
| `showCard()` | Places one question on the screen. |
| `checkAnswer()` | Compares the typed answer to the stored answer. |
| `submitScore()` | Sends the streak to the backend. |
| `refreshShared()` | Updates scoreboard and X-Ray Vision. |

## Learning Point
Most useful apps start with data. Here the data is the `decks` object.
