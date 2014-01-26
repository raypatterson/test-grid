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
            <div class="background-{{ block.color }} block pure-u-{{ block.grid }}">{{ block.name }}</div>
          {% endfor %}
        </div>
      {% endfor %}
    </div>

    <script src="main.js" type="application/javascript"></script>

  </body>
</html>