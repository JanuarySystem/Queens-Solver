# Queens Solver
## TODO:
- How to store a puzzle
-- Dimensions
-- Cell State
-- Regions
- UI
-- Pure HTML?
--- Direct Dom malipulation by cell ID
- Loader
-- Image reading
--- I want to do this in pure JS with no libraries if possible.
---- Draw to a canvas and read pixels? Is this needed?
- Solver
-- Rules System Eval Loop
-- Basic Rules blocking (No same row, column, or region)
-- Basic Last possible filling
-- Save and rollback marking
-- Fancy Rules