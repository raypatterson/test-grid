<!DOCTYPE html>
<html>
  <head>
    <title>{{ title }}</title>
    <link href="main.css" rel="stylesheet" type="text/css"></link>
  </head>
  <body>
    <header>
      <h1 class="name">
         {{ name }}
      </h1>
      <h2 class="desc">
        {{ desc }}
      </h2>
    </header>

    <div class="layers">
      {% for layer in layers %}
        <div class="blocks pure-g-r">
          {% for block in layer %}
            <div class="block pointer pure-u-{{ block.grid }}">
              <div class="block-background background-{{ block.color }}"></div>
              <div class="block-hover background-white"></div>
              <div class="block-name">{{ block.name }}</div>
            </div>
          {% endfor %}
        </div>
      {% endfor %}
    </div>

    <script src="main.js" type="application/javascript"></script>

  </body>
</html>