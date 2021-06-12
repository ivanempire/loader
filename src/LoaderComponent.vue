<template>
  <svg>
    <g />
  </svg>
</template>

<script>

  import { select, arc, range, interpolate, easePolyInOut } from "d3";
  import { onMounted } from "vue";

  // Dimensions for the SVG container
  const CONTAINER_WIDTH = 400;
  const CONTAINER_HEIGHT = 400;

  // Arc thickness
  const ARC_OUTER_RADIUS = 200;
  const ARC_INNER_RADIUS = 150;
  const ARC_CORNER_RADIUS = (ARC_OUTER_RADIUS - ARC_INNER_RADIUS) / 2

  // Transition settings - delay offset was eyeballed to remove the pause between animation cycles
  const TRANSITION_DURATION = 750;
  const TRANSITION_DELAY_CONSTANT_OFFSET = 400;

  /**
   * Some variables for customization, although I haven't messed around with these after publishing :P
   *
   * ELEMENT_COUNT    ==> Total number of arcs to work with (16 main + 2 flying)
   * ELEMENT_BLENDING ==> I eyeballed this, but makes sure elements look like one arc due to goo effect
   * ELEMENT_START    ==> First angle; README with proper explanation incoming
   * ELEMENT_LENGTH   ==> Length of each arc - main portion takes up half the circle, so we base it off of that
   * ELEMENT_BUFFER   ==> Amount by which to offset the arc moves after the transition to animate the circle as a whole
   */
  const ELEMENT_COUNT = 18;
  const ELEMENT_BLENDING = 0.2;
  const ELEMENT_START = 1.75 * Math.PI;
  const ELEMENT_LENGTH = Math.PI / (ELEMENT_COUNT - 2);
  const ELEMENT_BUFFER = ELEMENT_LENGTH * 2;

  export default {
    name: "LoaderComponent",
    setup(props) {
      onMounted(() => {

        // Create the three main containers - SVG itself, defs for all the filters, and group for the arcs
        let svg = select("svg")
            .attr("width", CONTAINER_WIDTH)
            .attr("height", CONTAINER_HEIGHT);
        let defs = svg.append("defs");
        let group = svg.select("g")
            .attr("class", "container");

        // Clipping container in which to draw the arcs
        let clippingContainer = defs.append("clipPath").attr("id", "debugClip");

        // Rectangle serves for the color - it covers the whole SVG container, but it clipped because the arcs are
        // actually added to the defs tag
        let fillerRect = group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", CONTAINER_WIDTH)
            .attr("height", CONTAINER_HEIGHT)
            .attr("clip-path", "url('#debugClip')")
            .attr("fill", "url('#loaderGradient')")

        let arcGenerator = arc()
            .innerRadius(ARC_INNER_RADIUS)
            .outerRadius(ARC_OUTER_RADIUS)
            .cornerRadius(ARC_CORNER_RADIUS);

        // Angle data over which D3 will iterate to draw the arcs
        let arcData = range(ELEMENT_COUNT).map(item => {
          return {
            startAngle: ELEMENT_START + ELEMENT_LENGTH * (item - 1),
            endAngle: ELEMENT_START + ELEMENT_LENGTH * item + ELEMENT_BLENDING
          }
        });

        // Draw all of the arcs, using the arcData above for the angles
        let arcs = clippingContainer.selectAll("path")
            .data(arcData)
            .enter()
            .append("path")
            // Transform the icon to center it in the SVG, more or less
            .attr("transform", "translate(" + (CONTAINER_WIDTH/2) + "," + (CONTAINER_HEIGHT/2) + ")")
            .attr("d", (d) => {
              return arcGenerator({
                startAngle: d.startAngle,
                endAngle: d.endAngle
              });
            });

        // Start the animation
        animateLoader();

        function animateLoader() {
          arcs.transition()
              .ease(easePolyInOut)
              .duration(TRANSITION_DURATION)
              .delay((d, i) => { return (ELEMENT_COUNT - 1 - i) * TRANSITION_DELAY_CONSTANT_OFFSET; })
              .attrTween("d", (d) => {
                // Compute the new angles by adding Math.PI, but accounting for the shift via ELEMENT_BUFFER
                let finalAngles = {
                  startAngle: d.startAngle + Math.PI - ELEMENT_BUFFER,
                  endAngle: d.endAngle + Math.PI - ELEMENT_BUFFER
                };

                let interpolation = interpolate(d, finalAngles);

                return function(t) {
                  // This is important - change d to new values, otherwise this jumps after one cycle
                  d.startAngle = interpolation(t).startAngle;
                  d.endAngle = interpolation(t).endAngle;
                  return arcGenerator(d);
                }
              })
              .on("end", (d, i) => {
                // We only want to restart the animation once the second to last arc has traveled to the other one
                if (i === 1) {
                  animateLoader();
                }
              });
        }

        // Create the gooey effect
        let filter = defs.append("filter")
            .attr("id", "gooFilter")

        filter.append("feGaussianBlur")
            .attr("in","SourceGraphic")
            .attr("stdDeviation","10")
            .attr("color-interpolation-filters","sRGB")
            .attr("result","blur");

        filter.append("feColorMatrix")
            .attr("class","blurValues")
            .attr("in","blur")
            .attr("mode","matrix")
            .attr("values","1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9")
            .attr("result","gooey");

        filter.append("feBlend")
            .attr("in","SourceGraphic")
            .attr("in2","gooey");

        filter.append("feComposite")
            .attr("in","SourceGraphic")
            .attr("in2","gooey")
            .attr("operator","atop");

        // Apply goo filter to the container
        group.style("filter", "url('#gooFilter')");

        // Setup the colors for the gradient
        let arcGradientColors = [
          {offset: "30%", color: "#fa9511"},
          {offset: "60%", color: "#fe462f"},
          {offset: "90%", color: "#ff1f6c"},
          {offset: "100%", color: "#f92f90"}
        ];

        // Create the gradient
        let arcGradient = defs.append("linearGradient").attr("id", "loaderGradient");
        arcGradient.attr("gradientTransform", "rotate(45)");
        arcGradient.selectAll("stop")
            .data(arcGradientColors)
            .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });
      });
    }
  }

</script>
<style>
svg {
  display: block;
  margin: 100px auto 0 auto;
}
</style>