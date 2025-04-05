# Joplin plugin — frontmatter overview
Create dynamic tables based on frontmatter in your notes. Works on both desktop and mobile.

## Quick Example

Given these two notes in a notebook called `Books 2025`:

| Note 1                                                                                         | Note 2                                                                                   |
|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| <pre>---<br>title: Book 1<br>rating: 5<br><br>---<br>Thoughts about book...</pre> | <pre>---<br>title: Book 2<br>author: Author 2<br>rating: 2<br><br>---</pre> |

Using the following code block in a note:
  
    ```frontmatter-overview
    from: notebook:"Books 2025"
    properties:
      - NOTE_LINK AS Title
      - title AS Book
      - author
      - rating AS ⭐
    sort: rating DESC
    ```

Will generate this table:

| Title      | Book   | author   | ⭐ |
|------------|--------|----------|---|
| [Note 1]() | Book 1 |          | 5 |
| [Note 2]() | Book 2 | Author 2 | 2 |

---

## Usage

To create a frontmatter-based table:

1. Use a fenced code block with the language set to `frontmatter-overview`.
2. Inside, define:
   - `from`: a [Joplin search query](https://joplinapp.org/help/apps/search/) to select notes, each note will become a row in the table.
   - `properties`: list of frontmatter fields to include as table columns.
     - Use `AS` to rename columns (`author AS Author`).
   - `sort`: (optional) sort the table by any property.

You can place multiple of these blocks in one note.

> ❗**Does not work in Rich Text (WYSIWYG) editor.** ❗ 

---

## What is Frontmatter?

Frontmatter is a block of YAML metadata at the top of a note, enclosed in triple dashes:
Since Joplin doesn't natively support frontmatter, it's best to leave a new line after the last property, so that it's not rendered as a header.

```yaml
---
title: Example
rating: 5

---
```

This plugin supports Markdown links and images in the frontmatter, although they are not valid YAML.  
A note with invalid YAML syntax will be shown with empty values in the custom properties.
Tip: Add the `NOTE_LINK` column to easily find the problematic notes and fix the syntax.

---

## Overview Block Options

| Key          | Description                                                                                                                          |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `from`       | Joplin search filter based on this [syntax](https://joplinapp.org/help/apps/search/) — all matching notes become a row in the table. |
| `properties` | List of frontmatter fields or [special properties](#special-properties).<br> Use `AS` to rename the property in the table header.    |
| `sort`       | (Optional) Sort the table by a property (add `DESC` for descending). <br> Value needs to match one of the original property names.   |

---

## Special Properties

- `NOTE_LINK`: A clickable link to the note using its title.

---

## Features

- Embed multiple tables per note.
- Create permanent tables via `Tools → Frontmatter Overview → Make tables in current note permanent` (desktop only).
- Notes missing a property will have an empty cell.
- Notes with invalid frontmatter are included with empty custom property values (special properties like `NOTE_LINK` still work).
- The note containing the code block is excluded from the search.

---

## Source Code

Find the source code here: [https://github.com/Meisenburger13/joplin-frontmatter-overview](https://github.com/Meisenburger13/joplin-frontmatter-overview)

Please create an issue if you find a bug or are missing a feature and I will take  look!