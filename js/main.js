Array.prototype.sample = function() {
  return this[Math.floor(Math.random() * this.length)];
};

var Cell = function(row, col) {
  this.row = row;
  this.col = col;
  this.north = null;
  this.south = null;
  this.east = null;
  this.west = null;
  this._links = {};
  this.hidden = true;
  this.frontier = false;
  this.value = null;
};

Cell.prototype.reveal = function() {
  $.each(this._links, function(hash_key, link) {
    $.each(link._links, function(hash_key, second_link) {
      second_link.frontier = true;
    });
    link.hidden = false;
    link.frontier = false;
  });
  this.hidden = false;
  this.frontier = false;
};

Cell.prototype.link = function(cell, opt_bidi) {
  if (opt_bidi !== false) {
    opt_bidi = true;
  }
  this._links[cell.hash_key()] = cell;
  if (opt_bidi) {
    cell.link(this, false);
  }
};

Cell.prototype.unlink = function(cell, opt_bidi) {
  if (opt_bidi !== false) {
    opt_bidi = true;
  }
  delete this._links[cell.hash_key()];
  if (opt_bidi) {
    cell.unlink(this, false);
  }
};

Cell.prototype.links = function() {
  return $.map(this._links, function(val) { return val; });
};

Cell.prototype.is_linked = function(cell) {
  return cell && !!this._links[cell.hash_key()]
};

Cell.prototype.neighbors = function() {
  ans = [];
  if (this.north) { ans.push(this.north); }
  if (this.south) { ans.push(this.south); }
  if (this.east) { ans.push(this.east); }
  if (this.west) { ans.push(this.west); }
  return ans;
};

Cell.prototype.hash_key = function() {
  return this.row + ':' + this.col;
}

Cell.prototype.distances = function() {
  var distances = new Distances(this);
  var frontier = [this];

  while (frontier.length) {
    var new_frontier = [];

    $.each(frontier, function(i, cell) {
      $.each(cell.links(), function(j, linked) {
        if (!distances.get(linked)) {
          distances.set(distances.get(cell)[0] + 1, linked);
          new_frontier.push(linked);
        }
      });
    });
    frontier = new_frontier;
  }
  return distances;
};


var Grid = function(rows, cols) {
  this.rows = rows;
  this.cols = cols;

  this.prepare_grid();
  this.configure_cells();
};

Grid.prototype.prepare_grid = function() {
  this.grid = [];
  for (var r=0; r<this.rows; r++) {
    var col = []
    for (var c=0; c<this.cols; c++) {
      col.push(new Cell(r, c));
    }
    this.grid.push(col)
  }
};

Grid.prototype.configure_cells = function() {
  this.each_cell(function(cell) {
    var row = cell.row;
    var col = cell.col;

    cell.north = this.get(row - 1, col);
    cell.south = this.get(row + 1, col);
    cell.east = this.get(row, col + 1);
    cell.west = this.get(row, col - 1);
  }.bind(this));
};

Grid.prototype.size = function() {
  return this.rows * this.cols;
};

Grid.prototype.get = function(row, col) {
  if (row < 0 || row > this.rows - 1|| col < 0 || col > this.cols - 1) {
    return null;
  }
  return this.grid[row][col];
};

Grid.prototype.random_cell = function() {
  row = this.grid.sample();
  return row.sample();
};

Grid.prototype.each_row = function(callback) {
  for (var r=0; r<this.grid.length; r++) {
    callback(this.grid[r]);
  }
};

Grid.prototype.each_cell = function(callback) {
  this.each_row(function(row) {
    for (var c=0; c<row.length; c++) {
      callback(row[c]);
    }
  });
};


var Distances = function(root) {
  this.root = root;
  this.cells = {};
  this.cells[this.root.hash_key()] = [0, this.root]
};

Distances.prototype.get = function(cell) {
  return this.cells[cell.hash_key()] || null;
};

Distances.prototype.set = function(distance, cell) {
  this.cells[cell.hash_key()] = [distance, cell];
};

Distances.prototype.cells = function() {
  $.map(this.cells, function(val) {
    return val[1];
  })
};

function binary_tree_on(grid) {
  grid.each_cell(function(cell) {
    var neighbors = [];
    if (cell.north) {
      neighbors.push(cell.north);
    }
    if (cell.east) {
      neighbors.push(cell.east);
    }

    var neighbor = neighbors.sample();
    if (neighbor) {
      cell.link(neighbor);
    }
  });
}

function recursive_backtracker_on(grid, opt_start_at) {
  var start_at = null;
  if (!opt_start_at) {
    start_at = grid.random_cell();
  } else {
    start_at = opt_start_at;
  }

  var stack = []
  stack.push(start_at);

  while (stack.length) {
    var current = stack[stack.length - 1];
    var neighbors = $.map(current.neighbors(), function(n) {
      if (!n.links().length) return n;
    });

    if (!neighbors.length) {
      stack.pop();
    } else {
      var neighbor = neighbors.sample();
      current.link(neighbor);
      stack.push(neighbor);
    }
  }
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function draw(ctx, grid, distances) {
  ctx.canvas.height = window.innerHeight - 40;
  ctx.canvas.width = window.innerWidth / 2 - 40;

  padding_x = Math.ceil(ctx.canvas.width / grid.cols);
  padding_y = Math.ceil(ctx.canvas.height / grid.rows);

  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2.0;
  ctx.font = '8px serif';
  ctx.imageSmoothingEnabled = false;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#ccc';
  var base_width = (ctx.canvas.width - (padding_x * 2)) / grid.cols;
  var box_width = Math.floor(base_width);
  padding_x += (base_width - box_width) * grid.cols / 2;
  var base_height = (ctx.canvas.height - (padding_y * 2)) / grid.rows;
  var box_height = Math.floor(base_height);
  padding_y += (base_height - box_height) * grid.rows / 2;

  grid.each_cell(function(cell) {
    var x1 = cell.col * box_width + padding_x;
    var y1 = cell.row * box_height + padding_y;
    var x2 = (cell.col + 1) * box_width + padding_x;
    var y2 = (cell.row + 1) * box_height + padding_y;

    if (!cell.north) { drawLine(ctx, x1, y1, x2, y1); }
    if (!cell.west) { drawLine(ctx, x1, y1, x1, y2); }

    if (!cell.is_linked(cell.east)) { drawLine(ctx, x2, y1, x2, y2); }
    if (!cell.is_linked(cell.south)) { drawLine(ctx, x1, y2, x2, y2); }

    if (false && cell.hidden) {
      ctx.fillRect(x1, y1, box_width, box_height);
    } 
    if (false && cell.frontier && distances) {
      var d = distances.get(cell);
      if (d) {
        ctx.fillStyle = 'red';
        window.console.log(d[0]);
        ctx.fillText(d[0], x1 + box_width / 3,
                     y1 + box_height / 2, box_width * 2 /3);
	      ctx.fillStyle = '#ccc';
      }
    }
  });
}

$(function() {
  grid = new Grid(40, 40);
  recursive_backtracker_on(grid);
  var start = grid.random_cell();
  start.reveal();
  var distances = start.distances();

  var ctx = $('#maze').get(0).getContext('2d');
  draw(ctx, grid, distances);

  $(window).resize(function() {
    draw(ctx, grid, distances);
  });
});
