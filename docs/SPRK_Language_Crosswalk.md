# SPRK Language Crosswalk

This guide translates common programming concepts across different languages. If you have experience in older structured languages (C, C++, Java) or newer systems languages (Go, Lua), this document helps map your existing mental models to the languages used in SPRK missions.

## Table of Contents
- [Concept 1: The Sliding Window (FIFO Buffer)](#concept-1-the-sliding-window-fifo-buffer)
- [Concept 2: Iterating Over Collections (The Foreach Loop)](#concept-2-iterating-over-collections-the-foreach-loop)
- [Concept 3: Key-Value Data Structures (Dictionaries / Maps)](#concept-3-key-value-data-structures-dictionaries--maps)
- [Concept 4: String Interpolation](#concept-4-string-interpolation)
- [Concept 5: Error Handling](#concept-5-error-handling)
- [Concept 6: Functions as Variables (Callbacks / Lambdas)](#concept-6-functions-as-variables-callbacks--lambdas)
- [Concept 7: Objects and Methods](#concept-7-objects-and-methods)
- [Concept 8: Multiple Return Values](#concept-8-multiple-return-values)
- [Concept 9: Null Defaults / Coalescing](#concept-9-null-defaults--coalescing)
- [Concept 10: Variable Scope (Avoiding Global Leaks)](#concept-10-variable-scope-avoiding-global-leaks)

## Concept 1: The Sliding Window (FIFO Buffer)
**The Goal:** Keep a list of exactly the last 80 items. When a new item is added, the oldest item is dropped.

### C / Java (The Manual / Linked List approach)
In older or heavily structured languages, you often manage the memory or list size manually, either shifting array elements or using a linked data structure.
```java
// Java example using a LinkedList
LinkedList<String> events = new LinkedList<>();
events.add(newEvent);
if (events.size() > 80) {
    events.removeFirst();
}
```

### Python (The Slicing approach)
Python abstracts array pointer math behind **Negative Indexing** and **Slices**.
```python
events.append(event)
del events[:-80] # Targets and deletes everything up to the last 80 items
```

### Go (The Slice Reassignment approach)
Go also uses slices, but instead of deleting, you reassign the slice bounds to a window of itself.
```go
events = append(events, event)
if len(events) > 80 {
    events = events[len(events)-80:] // Reslice to keep only the last 80
}
```

### Lua (The Table approach)
Lua uses Tables for all data structures. You manually remove the first index, which triggers Lua to shift the rest of the table down.
```lua
table.insert(events, event)
if #events > 80 then
    table.remove(events, 1) -- Removes index 1 and shifts the rest down
end
```

## Concept 2: Iterating Over Collections (The Foreach Loop)
**The Goal:** Loop through every item in a list without manually managing an incrementing counter (`i++`).

### C / Java
Modern Java uses an enhanced `for` loop, while older C requires manual index management.
```java
for (String event : events) {
    System.out.println(event);
}
```

### Python
Python natively iterates over the items directly.
```python
for event in events:
    print(event)
```

### Go
Go uses the `range` keyword, which always returns two values: the index and the value. If you don't need the index, you must discard it with an underscore `_`.
```go
for _, event := range events {
    fmt.Println(event)
}
```

### Lua
Lua uses `ipairs` (index pairs) for ordered lists/arrays.
```lua
for i, event in ipairs(events) do
    print(event)
end
```

## Concept 3: Key-Value Data Structures (Dictionaries / Maps)
**The Goal:** Store data with a specific label (key) instead of a numbered index.

### Java
Java requires importing and instantiating strongly-typed Map objects.
```java
HashMap<String, Integer> player = new HashMap<>();
player.put("score", 100);
```

### Python
Python uses Dictionaries (`dict`) with curly braces.
```python
player = {"score": 100}
```

### Go
Go uses the `map` keyword, explicitly defining the key and value types.
```go
player := map[string]int{"score": 100}
```

### Lua
Lua uses Tables for *everything*. A Table can act as an array or a dictionary simultaneously.
```lua
local player = {score = 100}
```

## Concept 4: String Interpolation
**The Goal:** Inject variables directly into a text string without clumsy concatenation (`"Score: " + score`).

### Java
Java uses `String.format`.
```java
String msg = String.format("Player %s scored %d", name, score);
```

### Python
Python uses "f-strings" (format strings), prefixing the string with `f`.
```python
msg = f"Player {name} scored {score}"
```

### Go
Go uses the `fmt` package to format strings.
```go
msg := fmt.Sprintf("Player %s scored %d", name, score)
```

### Lua
Lua uses `string.format` (similar to C's `printf`).
```lua
local msg = string.format("Player %s scored %d", name, score)
```

## Concept 5: Error Handling
**The Goal:** Safely handle a function that might fail without crashing the whole program.

### Java / Python (Exceptions)
Java and Python use a `try/catch` or `try/except` block to "catch" thrown errors.
```python
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"Failed: {e}")
```

### Go (Values)
Go actively rejects exceptions. Errors are just normal values returned by functions.
```go
result, err := DoMath()
if err != nil {
    fmt.Println("Failed:", err)
}
```

### Lua (Protected Calls)
Lua uses `pcall` (protected call) to run risky functions safely.
```lua
local success, err = pcall(function() return 10 / 0 end)
if not success then
    print("Failed: " .. err)
end
```

## Concept 6: Functions as Variables (Callbacks / Lambdas)
**The Goal:** Pass a function as an argument to another function, often used for clicking buttons or delays.

### Java
Java traditionally uses Interfaces, but now supports lambda functions.
```java
button.onClick(e -> {
    System.out.println("Clicked!");
});
```

### Python
Python uses `lambda` for one-liners, or passes the name of a `def` directly.
```python
button.onclick(lambda e: print("Clicked!"))
```

### Go
Go allows anonymous functions to be passed seamlessly.
```go
button.OnClick(func(e Event) {
    fmt.Println("Clicked!")
})
```

### Lua
Functions in Lua are first-class values and can be assigned directly to table properties.
```lua
button.onclick = function(e)
    print("Clicked!")
end
```

## Concept 7: Objects and Methods
**The Goal:** Bind a function directly to the data it modifies.

### Java / Python (Classes)
Object-Oriented languages group data and methods inside a `class`.
```python
class Player:
    def __init__(self):
        self.score = 0
        
    def add_score(self, amount):
        self.score += amount
```

### Go (Structs and Receivers)
Go doesn't have classes. You attach "Receiver functions" to Structs.
```go
type Player struct { score int }

func (p *Player) AddScore(amount int) {
    p.score += amount
}
```

### Lua (Tables and Metatables)
Lua creates objects using Tables. The colon `:` is syntactic sugar that automatically passes `self` to the function.
```lua
Player = {score = 0}

function Player:addScore(amount)
    self.score = self.score + amount
end
```

## Concept 8: Multiple Return Values
**The Goal:** Return more than one piece of data from a function (like X and Y coordinates).

### Java
Java restricts functions to returning exactly one thing. You must create a custom Object, use an Array, or use a `Pair`/`Map`.
```java
int[] getCoords() {
    return new int[]{10, 20};
}
```

### Python / Go / Lua
Modern languages natively support returning multiple values at once.
```python
# Python
def get_coords():
    return 10, 20
x, y = get_coords()
```
```go
// Go
func getCoords() (int, int) {
    return 10, 20
}
x, y := getCoords()
```

## Concept 9: Null Defaults / Coalescing
**The Goal:** Provide a default fallback value if a variable is missing or null.

### Java
Java uses the Ternary Operator `? :` or explicit `if/else`.
```java
String finalName = (name != null) ? name : "DefaultName";
```

### Python
Python uses inline `if/else` or the `or` keyword.
```python
final_name = name or "DefaultName"
```

### Lua
Lua makes heavy use of the `or` operator to assign default values concisely.
```lua
local finalName = name or "DefaultName"
```

## Concept 10: Variable Scope (Avoiding Global Leaks)
**The Goal:** Create a variable that only exists inside the current block of code and doesn't pollute the rest of the application.

### C / Java
Variables are strictly block-scoped. You must declare their type.
```java
int x = 5;
```

### Python
Python has no variable declaration keywords. Variables are automatically scoped to the function they are in.
```python
x = 5
```

### Go
Go uses `:=` to both declare and assign a block-scoped variable, inferring its type automatically.
```go
x := 5
```

### Lua
Lua variables are **GLOBAL** by default, which causes massive bugs. You must explicitly use `local` to scope them.
```lua
local x = 5
```
```