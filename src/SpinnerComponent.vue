<template>
  <svg>
    <g />
  </svg>
</template>

<script>

  import { select, arc, range, easeLinear, interpolate } from "d3";
  import { onMounted } from "vue";

  const CONTAINER_WIDTH = 400;
  const CONTAINER_HEIGHT = 400;

  const ELEMENT_COUNT = 18;
  const ELEMENT_BLENDING = 0.2;
  const ELEMENT_START = 1.75 * Math.PI;
  const ELEMENT_LENGTH = Math.PI / (ELEMENT_COUNT - 2);
  const ELEMENT_BUFFER = ELEMENT_LENGTH * 2;

  export default {
    name: "SpinnerComponent",
    setup(props) {
      onMounted(() => {

        let svg = select("svg")
            .attr("width", CONTAINER_WIDTH)
            .attr("height", CONTAINER_HEIGHT);

        let defs = svg.append("defs");

        let group = svg.select("g")
            .attr("class", "container");

        let fillerRect = group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", CONTAINER_WIDTH)
            .attr("height", CONTAINER_HEIGHT)
            .attr("clip-path", "url('#debugClip')")
            .attr("fill", "url('#loaderGradient')")

        let clippingContainer = defs.append("clipPath")
        .attr("id", "debugClip");

        let arcGenerator = arc()
            .innerRadius(150)
            .outerRadius(200)
            .cornerRadius(25);

        let segmentData = range(ELEMENT_COUNT).map(item => {
          return {
            startAngle: ELEMENT_START + ELEMENT_LENGTH * (item - 1),
            endAngle: ELEMENT_START + ELEMENT_LENGTH * item + ELEMENT_BLENDING
          }
        });

        let blobs = clippingContainer.selectAll("path")
            .data(segmentData)
            .enter()
            .append("path")
            .attr("transform", "translate(" + ( CONTAINER_WIDTH / 2 ) + "," + ( CONTAINER_HEIGHT / 2 ) + ")" )
            .attr("d", (d) => {
              return arcGenerator({
                startAngle: d.startAngle,
                endAngle: d.endAngle
              });
            });

        animateLoader();

        function animateLoader() {
          blobs.transition()
              .ease(easeLinear)
              .duration(750)
              .delay((d, i) => { return (ELEMENT_COUNT - 1 - i) * 400; })
              .attrTween("d", (d) => {
                let finalAngles = {
                  startAngle: d.startAngle + Math.PI - ELEMENT_BUFFER,
                  endAngle: d.endAngle + Math.PI - ELEMENT_BUFFER
                };

                let interpolation = interpolate(d, finalAngles);

                return function(t) {
                  d.startAngle = interpolation(t).startAngle;
                  d.endAngle = interpolation(t).endAngle;
                  return arcGenerator(d);
                }
              })
              .on("end", (d, i) => {
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

        group.style("filter", "url('#gooFilter')");

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
  margin: 100px auto 0px auto;
}
</style>