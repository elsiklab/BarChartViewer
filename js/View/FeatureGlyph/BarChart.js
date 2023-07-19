define([
           'dojo/_base/declare',
           'dojo/_base/lang',
           'JBrowse/Util/FastPromise',
           'JBrowse/View/FeatureGlyph/Box',
           'JBrowse/View/FeatureGlyph/_FeatureLabelMixin',
           'JBrowse/Util',
        ],
       function(
           declare,
           lang,
           FastPromise,
           BarChart,
           FeatureLabelMixin,
           Util,
       ) {

return declare([BarChart, FeatureLabelMixin], {
    /* Adapted from JBrowse/View/FeatureGlyph/Box.js */

    //constructor: function() {
    //    console.log("Calling BarChart Glyph constructor");
    //},

    _defaultConfig: function() {
        return this._mergeConfigs(
            this.inherited(arguments),
            {
                style: {
                    maxDescriptionLength: 70,
                    mouseovercolor: 'rgba(0,0,0,0.3)',
                    borderColor: null,
                    borderWidth: 0.5,
                    marginBottom: 2,
                    minHeight: 10,
		    textHeight: 10,
                    strandArrow: false,
                },
            });
    },

     _scaleHeight: function ( h, displayMode ) {
	var scaledHeight = h;

	if ( this.track.config.style.useLogScale )
	    scaledHeight = Math.log(1.0 + h) / Math.log(this.track.config.style.logBase);

        if( displayMode == 'compact' )
	    scaledHeight = 0.45 * scaledHeight;

	return Math.max(1, Math.round(scaledHeight * this.track.config.style.scaleFactor));
    },

    _getTextHeight: function ( viewArgs, feature ) {
        // If not displaying category numbers, text height is zero
	if ( !this.track.config.displayCategoryNumbers)
            return 0;
		
        // Feature might be too small to display text labels properly
        var left  = viewArgs.block.bpToX( feature.get('start') );
        var width = viewArgs.block.bpToX( feature.get('end') ) - left;
        var expCount = feature.get('exp_count');
        var barWidth = Math.max(1, width / expCount);
        var maxNumDigits = Math.floor(Math.log10(expCount))+1;
        return ( barWidth >= this.track.MIN_WIDTH_MULT * maxNumDigits ) ? this.config.style.textHeight : 0;
    },

    _getFeatureHeight: function( viewArgs, feature ) {
	var height;
        var expCount = feature.get('exp_count');
	var expScores = feature.get('exp_scores');
        var minHeight = this.config.style.minHeight;

	if ( viewArgs.displayMode == 'collapsed' || feature.collapsed ) {
            return minHeight;
	}

        // Find the max bar height and apply scaling
        var maxH = Math.max(...expScores);
        var h = this._scaleHeight(maxH, viewArgs. displayMode);
        height = Math.max(minHeight, h);

	if ( viewArgs.displayMode == 'compact' ) {
	    return height;
	}

        // Add extra height for category numbers, if applicable
        return height + this._getTextHeight( viewArgs, feature );
    },

    renderFeature: function( context, fRect ) {
        context.clearRect( Math.floor(fRect.l), fRect.t, Math.ceil(fRect.w-Math.floor(fRect.l)+fRect.l), fRect.h );
        this.renderBarChart( context, fRect.viewInfo, fRect.f, fRect.t, fRect.rect.h, fRect.f );
        this.renderLabel( context, fRect );
        this.renderDescription( context, fRect );
    },

    // top and height are in px
    renderBarChart: function( context, viewInfo, feature, top, overallHeight, parentFeature, style ) {
        var left  = viewInfo.block.bpToX( feature.get('start') );
        var width = viewInfo.block.bpToX( feature.get('end') ) - left;

        //style = style || lang.hitch( this, 'getStyle' );

        var height = this._getFeatureHeight( viewInfo, feature );

        if( ! height )
            return;
        if( height != overallHeight )
            top += Math.round( (overallHeight - height)/2 );

	// fill background
	context.fillStyle = '#FFFFFF';
	context.fillRect(left, top, Math.max(1, width), height);

	var bottom = top + overallHeight;
        var expCount = feature.get('exp_count');

	if ( this.track.displayMode == 'collapsed' || feature.collapsed ) {
            // collapsed display (one bar)
            this.renderCollapsedBar(context, feature, left, bottom, width, height);
	} else if ( width <= 2 * expCount ) {
            // summary display (one bar), window too small to render full chart
            this.renderSummaryBar(context, feature, left, bottom, width, viewInfo.displayMode);
        } else {
            // render full bar chart
            var textHeight = this._getTextHeight( viewInfo, feature );
            this.renderFullBarChart(context, feature, left, bottom, width, viewInfo.displayMode, textHeight);
        }
    },

    renderFullBarChart( context, feature, left, bottom, width, displayMode, textHeight ) {
        // width of each individual bar
	var expCount = feature.get('exp_count');
	var expScores = feature.get('exp_scores');
        var scaledBarHeights = expScores.map(x => this._scaleHeight(x, displayMode));

        var barWidth = Math.max(1, width / expCount);
	var startX, endX, textWidth;

        var colorPalette = this.track.Palette;
        var numColors = colorPalette.length;
        const MIN_WIDTH_MULT = this.track.MIN_WIDTH_MULT;

        scaledBarHeights.forEach( function(h, idx) {
            // x start position is one bar's width to the right of the previous bar
            startX = left + idx * barWidth;
            endX = left + (idx + 1) * barWidth;

            // individual bar, color chosen from color palette
            context.fillStyle = colorPalette[(idx % numColors)];
            context.fillRect( startX, bottom - textHeight, barWidth, -1.0 * h );

            if ( textHeight > 0 ) {
                // text background
                context.fillStyle = '#dddddd';
                context.fillRect( startX, bottom, barWidth, -1.0 * textHeight );
                // text labeling bar category number
                // text width depends on number of digits
                textWidth = Math.max(0, MIN_WIDTH_MULT * Math.floor(Math.log10(idx)));
                context.fillStyle = '#000000';
                context.fillText((idx + 1), startX + Math.max(0, (barWidth - textWidth) / 2), bottom, barWidth);
                // spacer
                context.fillStyle = '#888888';
                context.fillRect( endX - 1, bottom, 1, -1.0 * textHeight );
            }
        });
    },

    renderSummaryBar( context, feature, left, bottom, width, displayMode ) {
        // draw one bar representing average of scores, scaled according to config settings
	var expCount = feature.get('exp_count');
	var expScores = feature.get('exp_scores');
        var scaledBarHeights = expScores.map(x => this._scaleHeight(x, displayMode));

        var barAvg = 0;
        scaledBarHeights.forEach( function(h, idx) {
            barAvg += h / expCount;
        });

        context.fillStyle = this.config.style.color;
        context.fillRect( left, bottom, width, -1.0 * barAvg );	
    },

    renderCollapsedBar( context, feature, left, bottom, width, height ) {
        // Draw one bar with color of category with highest value if more than 10% of total expression,
        // or dark gray if no such category
        var expScores = feature.get('exp_scores');
	var sum = 0;
	var maxH = 0;
	var maxIdx = 0;
        expScores.forEach( function(h, idx) {
            sum += h;
	    if ( h > maxH ) {
                // Need idx of max score to determine its color
                maxH = h;
                maxIdx = idx;
            }
        });
        var bgcolor = "#888888";
        if ( maxH / sum >= 0.1 ) {
            var colorPalette = this.track.Palette;
            var numColors = colorPalette.length;
            bgcolor = colorPalette[(maxIdx % numColors)];
        }
        context.fillStyle = bgcolor;
        context.fillRect( left, bottom, width, -1.0 * height );
    },

    // feature label is handled by updateStaticElements
    renderLabel: function( context, fRect ) {
    },

    // feature description is handled by updateStaticElements
    renderDescription: function( context, fRect ) {
    },
});
});
