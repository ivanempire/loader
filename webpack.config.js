const HtmlWebpackPlugin   = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const path                = require("path");

module.exports = {
    entry: "./src/index.js",
    mode: "development",
    output: {
        filename: "loader.js",
        path: path.resolve(__dirname, "dist")
    },
    devServer: {
        publicPath: "/",
        contentBase: path.resolve(__dirname, "dist"),
        hot: true,
        inline: true,
        port: 8000
    },
    optimization: {
        usedExports: true
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                include: /src|node_modules/,
                use: ["vue-style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            esModule: false
                        }
                    }]
            }
        ]
    },
    plugins: [new VueLoaderPlugin(), new HtmlWebpackPlugin({
        template: "./src/site.html",
        filename: "index.html",
        title: "Loading icon"
    })]
}