# V22 design guide

Use the 2D Design and 3D Design main tabs. Their profession bar contains Physics,
Chemistry, Mathematics, Medical, Geology, Electrical and Architecture. Pick parts,
then adjust position, size, rotation, colour and label. General shapes remain
available in every profession. The premade subject browsing tabs and Starter
diagrams menus have been removed. Existing embedded diagrams still open for editing.

## Architecture

Start a new Architecture drawing and set drawing units. Changing the unit label
does not rescale existing coordinates. In a blueprint, X/Y are plan coordinates;
Z is elevation in 3D. Width is X, plan length is Y, elevation size is Z.
Room / house shell creates editable wall sections and an entrance gap. Optional
roof is available in 3D. Road builder adds footpaths and lane markings; bridge
builder adds a deck, parapets and the chosen number of paired piers. Stair builder
creates the requested number of steps. Set dimensions before adding construction.
Builders add parts at the origin of the existing drawing; use New for a separate
project. Draw wall, Draw road and Draw dimension use two clicks in 2D. Esc cancels.
Dimension labels follow the object's width. Drawn dimensions are independent
objects: reposition or resize them when the measured geometry changes.

Set grid spacing to control movement snapping. Repeat selected part makes a
spaced array. Align / mirror parts lets you choose multiple components. Undo/redo
also applies to builders and arrays. Copy to other dimension makes an independent
editable copy in the other workspace, preserving geometry and units. Save that
copy separately. Each diagram supports 500 objects and 800 terminal wires.

These are schematic drawing and conceptual modelling tools. PNG output is labeled
not to printed scale. There is no BIM exchange, construction approval, load-bearing
analysis or building-code validation. Electrical visual additions are illustrative;
the existing DC/transient solver remains for its supported components.

## Saved diagrams and teachers

Save diagram stores the editable model in the local application library. Use Save
to library and file for an independent .fte2d/.fte3d backup. The Saved diagrams
main tab searches all subjects and dimensions, with open, document insertion,
rename, export, delete and teacher-question actions. Import older saved diagrams
copies earlier user-created science libraries into this browser without deleting
the originals. Load file opens an exported design; Import file keeps it in the
library. Existing profile data and draft recovery are retained.

Teachers remains a main tab. My diagrams and Subject Tools > Label my saved diagram
open the saved library. Use in teacher question produces a labeled memorandum
snapshot and an unlabeled student snapshot for new part-based designs. Add numbered
targets and their answers in the Visual question builder, then save to the question
bank and issue an assessment. For older models, open them in their design workspace
first when no preview is available. Inspect their labels before issuing a question.
