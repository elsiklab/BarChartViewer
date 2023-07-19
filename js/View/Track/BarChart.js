/**
 * Feature track that draws features using HTML5 canvas elements.
 */

define( [
            'dojo/_base/declare',
            'dojo/_base/array',
            'dojo/_base/lang',
            'dojo/on',
            'BarChartViewer/View/Track/_FeatureDetailMixin',
	    'JBrowse/View/Track/CanvasFeatures',
            'JBrowse/Util',
        ],
        function(
            declare,
            array,
            lang,
            on,
            FeatureDetailMixin,
	    CanvasFeatures,
            Util
        ) {

return declare([CanvasFeatures, FeatureDetailMixin], {
    constructor: function( args ) {

        // Get colors from user-defined palette (or use default option)
        var paletteName = this.config.style.palette
        this.Palette = this._getPaletteArray(paletteName);

        // Multipler for how much space each digit in column labels needs to render properly
        this.MIN_WIDTH_MULT = 8;
    },

    _defaultConfig: function() {

	var config = Util.deepUpdate(dojo.clone(this.inherited(arguments)), {
            // default glyph class to use
            glyph: 'BarChartViewer/View/FeatureGlyph/BarChart',

            // maximum height of the track, in pixels
            maxHeight: 600,

            displayMode: 'normal',
            displayCategoryNumbers: true,

            onClick: {
                action: "contentDialog",
                title: '{name}',
                content: dojo.hitch( this, 'defaultFeatureDetail' )
            },

            style: {
                scaleFactor: 500,
                useLogScale: true,
                logBase: 10,
                palette: 'muted'
            }
        });

	/*
	 * Option to collapse an individual feature
	 * (potentially useful when multiple features are stacked vertically)
	 * Still has bugs - not quite working yet
        var track = this;
        config.menuTemplate.push({
            "label" : function() {
		var isCollapsed = !!( 'collapsed' in this.feature ? this.feature.collapsed : false );
                return isCollapsed ? 'Expand this feature' : 'Collapse this feature';
            },
            action: function(){
                this.feature.collapsed = !( 'collapsed' in this.feature ? this.feature.collapsed : false );
		track.redraw();
                track._clearLayout();
                track.hideAll();
                track.genomeView.showVisibleBlocks(true);
            },
            iconClass: function() {
                var isCollapsed = !!( 'collapsed' in this.feature ? this.feature.collapsed : false );
                return isCollapsed ? 'jbrowseIconVerticalResize' : 'jbrowseIconHorizontalResize';
            },
        });*/

        return config;
    },

    _trackMenuOptions: function() {
        var track = this;
        var options = this.inherited(arguments) || [];

        // Toggle use of log scale for bar heights
        // (Set log base in trackList.json or config editor)
        options.push({
            label: 'Use log scale',
            type: 'dijit/CheckedMenuItem',
            checked: !!(this.config.style.useLogScale == true),
            onClick: function(event) {
                if (this.checked) {
                    track.config.style.useLogScale = true;
                } else {
                    track.config.style.useLogScale = false;
                }
                track.changed();
                //track.browser.publish('/jbrowse/v1/v/tracks/replace', [track.config]);
            }
        });

        // Toggle display of category numbers
        options.push({
            label: 'Show category numbers',
            type: 'dijit/CheckedMenuItem',
            checked: !!(this.config.displayCategoryNumbers == true),
            onClick: function(event) {
                if (this.checked) {
                    track.config.displayCategoryNumbers = true;
                } else {
                    track.config.displayCategoryNumbers = false;
                }
                track.changed();
                //track.browser.publish('/jbrowse/v1/v/tracks/replace', [track.config]);
            }
        });

        // Toggle color palette selection (pre-defined palettes only; use trackList.json
        // or config editor to declare custom palette)
        var colorPaletteList = ["bright", "vibrant", "high-contrast", "light", "muted"];
        // Only display custom as option if it's already configured in trackList.json
        if ( track.config.style.palette == "custom" )
            colorPaletteList.push("custom");

        this.colorPaletteMenuItems = colorPaletteList.map(function(palette) {
            return {
                label: palette,
                type: 'dijit/RadioMenuItem',
                title: "Render barcharts using " + palette + " palette",
                checked: track.config.style.palette == palette,
                onClick: function() {
                    track.Palette = track._getPaletteArray(palette);
                    track.config.style.palette = palette;
                    track._clearLayout();
                    track.hideAll();
                    track.genomeView.showVisibleBlocks(true);
                    track.makeTrackMenu();
                }
            };
        });
        options.push({
            label: "Color palette",
            iconClass: "dijitIconPackage",
            children: this.colorPaletteMenuItems
        });

        return options;
    },

    _getPaletteArray: function( paletteName ) {
        // Define color palette as array
        // colorblind-safe palettes from https://personal.sron.nl/~pault/
        // default is "muted" (10 colors)
        var paletteColors = Array();
        switch (paletteName) {
            case "bright":
                paletteColors = Array("#4477aa", "#ee6677", "#228833", "#ccbb44", "#66ccee", "#aa3377", "#bbbbbb");
                break;
            case "vibrant":
                paletteColors = Array("#ee7733", "#0077bb", "#33BBee", "#ee3377", "#cc3311", "#009988", "#bbbbbb");
                break;
            case "high-contrast":
                paletteColors = Array("#004488", "#ddaa33", "#bb5566");
                break;
            case "light":
                paletteColors = Array("#77aadd", "#ee8866", "#eedd88", "#ffaabb", "#99ddff", "#44bb99", "#bbcc33", "#aaaa00", "#dddddd")
                break;
            case "custom":
                // custom user-defined palette
                paletteColors = this.config.style.paletteColors;
                // no break - check if colors defined properly below
            default:
                if (!Array.isArray(paletteColors) || (paletteColors.length == 0)) {
                    console.log("No color palette specified, or custom palette not properly configured - using default palette");
                    // default "muted"
                    paletteColors = Array("#cc6677", "#332288", "#ddcc77", "#117733", "#88ccee", "#882255", "#44aa99", "#999933", "#aa4499");
                }
        }

        return paletteColors;
    }
});
});
