/**
 * Mixin with methods for parsing making default feature detail dialogs.
 */
define([
            'dojo/_base/declare',
            'dojo/_base/array',
            'dojo/dom-construct',
            'JBrowse/View/Track/_FeatureDetailMixin'
        ],
        function(
            declare,
            array,
            domConstruct,
            FeatureDetailMixin
        ) {

return declare( FeatureDetailMixin, {

    /**
     * Default feature detail page customized for the given BarChart feature.
     * @returns {HTMLElement} feature detail page HTML
     */
    defaultFeatureDetail: function( /** JBrowse.Track */ track, /** Object */ f, /** HTMLElement */ featDiv, /** HTMLElement */ container, layer ) {
	container = container || dojo.create('div', { className: 'detail feature-detail feature-detail-'+track.name.replace(/\s+/g,'_').toLowerCase(), innerHTML: '' } );

        this._renderCoreDetails( track, f, featDiv, container );

        this._renderExpressionDetails( track, f, featDiv, container );

        this._renderAdditionalTagsDetail( track, f, featDiv, container );

        if (!this.config.hideSequenceBox) {
            this._renderUnderlyingReferenceSequence( track, f, featDiv, container );
        }


        this._renderSubfeaturesDetail( track, f, featDiv, container, layer||1 );

        // hook function extendedRender(track,f,featDiv,container)
        if (typeof this.extendedRender === 'function') {
            this.extendedRender(track,f,featDiv,container);
        }

        return container;
    },

    _renderExpressionDetails: function( track, f, featDiv, container ) {
        var expressionDetails = domConstruct.create('div', { className: 'expression' }, container );
        var fmt = dojo.hitch( this, function( name, value, feature, unsafe ) {
            return this.renderDetailField(container, name, value, feature, null, {}, unsafe);
        });
        expressionDetails.innerHTML = '<h2 class="sectiontitle">Expression Data</h2>';
        fmt('Categories and scores', this._renderExpTable( f ), f, true );
    },

    _renderExpTable: function( feature ) {
        var expScores = feature.get('exp_scores');
        var cellTypes = feature.get('cell_types');

        var html = '<table cellspacing=0 cellpadding=0 class="expression-values-table"><thead><tr class="expression-values"><th>Category</th>';
        if (cellTypes) {
            html += '<th>Score</th><th class="last-col">Cell Type</th>';
        } else {
            html += '<th class="last-col">Score</th>';
        }
        html += '</tr></thead><tbody>';
        var colors = this.Palette;
	var numColors = colors.length;
        for( var i = 0; i < expScores.length; i++ ) {
            if (i + 1 < expScores.length) {
                html += '<tr class="expression-values">';
            } else {
                html += '<tr class="expression-values last-row">';
            }
            html += '<td class="cat" style="background:' + colors[i % numColors] + '">' + (i+1) + '</td>';
            if (cellTypes) {
                html += '<td class="score">' + expScores[i] + '</td>';
                html += '<td class="celltype last-col">' + cellTypes[i] + '</td>';
	    } else {
                html += '<td class="score last-col">' + expScores[i] + '</td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        return '<div>'+html+'</div>';
    },
});
});
