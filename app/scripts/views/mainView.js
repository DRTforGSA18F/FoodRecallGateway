// MainView.js
// ----------
define([
	'jquery', 'backbone', 'text!templates/main.html', 'text!locale/main.json', 'text!locale/es_mx/main.json',
	'text!templates/dateRangeTemplate.html', 'text!templates/distributionPattern.html', 'text!templates/stateTemplate.html',
	'text!templates/recallStatusTemplate.html', 'text!templates/foodRecallCountTemplate.html',
	'text!templates/resultsSubTemplate.html', 'text!templates/detailsTemplate.html',
	'collections/recalledFoodCollection', 'd3', 'c3', 'helpers/uStates', 'collections/termsCollection',
], function($, Backbone, template, content, contentES, DateRangeTemplate, DistributionPatternTemplate, StateTemplate, RecallStatusTemplate,
	FoodRecallCountTemplate, ResultsSubTemplate, DetailsTemplate, RecalledFoodCollection,
	d3, c3, uStates, TermsCollection) {
	'use strict';

	// Creates a new Backbone View class object
	var MainView = Backbone.View.extend({

		// The Model associated with this view
		model: '',

		searchTerms: '',

		recallStatuses: '',

		stateList: '',

		dateRange: [2012, 2018],

		totalCount: 0,
		// View constructor
		initialize: function(options) {

			// Set language attribute to support localization
			this.language = (options && options.language) || 'en_us';

		},

		// View Event Handlers
		events: {
			'click button[id="btnSearch"]': 'getResults',
			'click a[id="prev"]': 'movePrev',
			'click a[id="next"]': 'moveNext',
			'click a[id^= "rn_"]': 'getDetails',
			'change #fromDate, #toDate': 'setDateRange',
			'click a[id="showMoreText"]': 'showMore'
		},

		// Renders the view's template to the UI
		render: function() {

			// Setting the view's template property using the Underscore template method
			this.template = _.template(template, {
				content: JSON.parse(content)
			});

			this.stateTemplate = _.template(StateTemplate, {});
			this.dateRangeTemplate = _.template(DateRangeTemplate, {});
			this.recallStatusTemplate = _.template(RecallStatusTemplate, {});
			// Dynamically updates the UI with the view's template
			this.$el.html(this.template);

			//load the advanced search items
			this.loadAdvancedSearch();
			this.loadFoodRecallCountDetails();
			var self = this;
			this.$el.find('#select-fooditem').selectize({
				maxItems: 3,
				plugins: ['remove_button'],
				delimiter: ',',
				persist: false,
				createOnBlur: true,
				create: function(input) {
					return {
						value: input,
						text: input
					}
				},
				onChange: function(value) {
					self.searchTerms = value;
				}
			});
			this.$el.find('#select-recallStatus').selectize({
				plugins: ['remove_button'],
				onChange: function(value) {
					self.recallStatuses = value;
				}
			});

			this.$el.find('#select-State').selectize({
				maxItems: 3,
				plugins: ['remove_button'],
				delimiter: ',',
				persist: false,
				onChange: function(value) {
					self.stateList = value;
				}
			});
			/*this.$el.find("#dateRange").slider().on('slideStop', function(ev){
				       self.dateRange = $('#dateRange').data('slider').getValue();			    
				});*/
			// Maintains chainability
			return this;


		},
		displayResults: function() {
			this.recalledFoodCollection = new RecalledFoodCollection();
			this.recalledFoodCollection.url = this.model.generateURL();

			var self = this;
			this.$el.find('#resultsSection').html('');
			this.$el.find('#detailsSection').html('');

			this.recalledFoodCollection.fetch({
				success: function() {
					self.totalCount = self.recalledFoodCollection.totalCount;
					self.loadTemplate();
					self.displayResultsChart();
				},
				error: function() {
					self.totalCount = 0;
					self.loadTemplate();
				}
			});

		},
		displayResultsChart: function() {
			//this.model.set({'searchTerms': this.model.get('searchTerms').replace(',', ' ')});
			this.resultsChartCollection = new TermsCollection();
			this.resultsChartCollection.url = this.model.generateCountURL();

			var self = this;
			this.resultsChartCollection.fetch({
				success: function() {
					self.resultsChartCollection.sort();
					self.loadChart(self.resultsChartCollection);
				}
			});
		},
		getChartColumns: function(chartCollection) {
			var chartCols = [];
			var colorArray = ['black', 'white', 'blue'];
			for (var i = 0; i < chartCollection.length; i++) {
				var colArray = [];
				colArray.push($.trim(chartCollection.at(i).attributes.name).toLowerCase().replace(' ', ''));
				colArray.push(chartCollection.at(i).attributes.count);
				colArray.push(colorArray[i]);
				//chartCols.push($.trim(chartCollection.at(i).attributes.name).toLowerCase().replace(' ', ''),chartCollection.at(i).attributes.count,colorArray[i]);
				chartCols.push(colArray);
			}

			return chartCols;
		},
		loadAdvancedSearch: function() {
			this.$el.find('#dateRangeSection').html(this.dateRangeTemplate);
			this.$el.find('#stateSection').html(this.stateTemplate);
			this.$el.find('#recallStatusSection').html(this.recallStatusTemplate);
		},
		loadChart: function(chartCollection) {
			var chart = c3.generate({
				bindto: '#chart',
				data: {
					columns: this.getChartColumns(chartCollection),
					type: 'donut'
				},
				donut: {
					title: "Recall Classification"
				}
			});

			chart.data.colors({
				classi: '#d595a0',
				classii: '#d27607',
				classiii: '#F5D60A'
			});
		},
		loadFoodRecallCountDetails: function() {
			//Pathogen recall count
			this.loadRecallCount('salmonella', this.salmonellaCollection, FoodRecallCountTemplate, window.gblSalmonellaCount);
			this.loadRecallCount('norovirus', this.norovirusCollection, FoodRecallCountTemplate, window.gblNorovirusCount);
			this.loadRecallCount('listeria', this.listeriaCollection, FoodRecallCountTemplate, window.gblListeriaCount);
			this.loadRecallCount('ecoli', this.ecoliCollection, FoodRecallCountTemplate, window.gblEcoliCount);

			//food pyramid recall count
			this.loadRecallCount('grain', this.grainCollection, FoodRecallCountTemplate, window.gblGrainCount);
			this.loadRecallCount('vegetable', this.vegetableCollection, FoodRecallCountTemplate, window.gblVegetableCount);
			this.loadRecallCount('fruit', this.fruitCollection, FoodRecallCountTemplate, window.gblFruitCount);
			this.loadRecallCount('oil', this.oilCollection, FoodRecallCountTemplate, window.gblOilCount);
			this.loadRecallCount('dairy', this.dairyCollection, FoodRecallCountTemplate, window.gblDairyCount);
			this.loadRecallCount('meat', this.meatCollection, FoodRecallCountTemplate, window.gblMeatCount);
		},
		//Load Recall Count Collection and template
		loadRecallCount: function(id, collectionName, templateName, serviceurl) {
			collectionName = new TermsCollection();
			collectionName.url = serviceurl;
			var self = this;
			collectionName.fetch({
				async: false
			}).done(function() {
				self.loadRecallTemplate(id, templateName, collectionName.sort().toJSON());
			});
		},
		loadRecallTemplate: function(id, templateName, collectiondata) {
			this.foodRecallTemplate = _.template(templateName, {
				data: collectiondata
			});
			this.$el.find('#' + id).html(this.foodRecallTemplate);
		},
		//load the respective templates
		loadTemplate: function() {

			this.subTemplate = _.template(ResultsSubTemplate, {
				content: JSON.parse(content),
				data: this.recalledFoodCollection.toJSON(),
				reqModel: this.model,
				maxCount: this.totalCount
			});

			this.$el.find('#resultsSection').html(this.subTemplate);


		},
		getDetails: function(e) {
			var recallNumber = $(e.target).data('id');

			var recallDetails = this.recalledFoodCollection.where({
				'recall_number': recallNumber
			});

			this.detailsTemplate = _.template(DetailsTemplate, {
				content: JSON.parse(content),
				data: recallDetails,
				reqModel: this.model
			});

			this.$el.find('#detailsSection').html(this.detailsTemplate);

			/////////////////////////////////////for classiiiclassiii: '#F5D60A'
			var mapColor = '#F5D60A';
			if ($.trim(recallDetails[0].attributes.classification).toLowerCase() === 'class i') {
				mapColor = '#d595a0';
			} else if ($.trim(recallDetails[0].attributes.classification).toLowerCase() === 'class ii') {
				mapColor = '#d27607';
			}

			var sampleData = {}; /* Sample random data. */
			["HI", "AK", "FL", "SC", "GA", "AL", "NC", "TN", "RI", "CT", "MA",
				"ME", "NH", "VT", "NY", "NJ", "PA", "DE", "MD", "WV", "KY", "OH",
				"MI", "WY", "MT", "ID", "WA", "DC", "TX", "CA", "AZ", "NV", "UT",
				"CO", "NM", "OR", "ND", "SD", "NE", "IA", "MS", "IN", "IL", "MN",
				"WI", "MO", "AR", "OK", "KS", "LS", "VA"
			]
			.forEach(function(d) {
				var low = Math.round(100 * Math.random()),
					mid = Math.round(100 * Math.random()),
					high = Math.round(100 * Math.random());
				sampleData[d] = {
					low: d3.min([low, mid, high]),
					high: d3.max([low, mid, high]),
					avg: Math.round((low + mid + high) / 3),
					//color: d3.interpolate("#ffffcc", "#800026")(low / 100)
					color: mapColor
				};
			});

			/* draw states on id #statesvg */
			uStates.draw("#statesvg", sampleData, this.tooltipHtml);
			///////////
			$('#details').get(0).scrollIntoView();
			$('#details').focus();

			document.getElementById('details').scrollIntoView(true)
			window.scrollBy(0, -95);
		},

		tooltipHtml: function(n, d) { /* function to create html content string in tooltip div. */
			return "<h4>" + n + "</h4><table>" +
				"<tr><td>Low</td><td>" + (d.low) + "</td></tr>" +
				"<tr><td>Average</td><td>" + (d.avg) + "</td></tr>" +
				"<tr><td>High</td><td>" + (d.high) + "</td></tr>" +
				"</table>";
		},

		showMore: function(e) {
			e.preventDefault();
			//this to toggle the text between read more and hide text
			//this.text('See Less');
			//this to taggle show/hide of the extra text
			$('#extraText').toggle();
			if(e.target.innerHTML === 'Read More')
			{
				e.target.innerHTML = 'Read Less';
			}
			else{
				e.target.innerHTML = 'Read More';
			}

		},

		getResults: function(e) {
			e.preventDefault();
			this.setModelDataAndNavigate();

		},
		moveNext: function(e) {
			e.preventDefault();
			var skipValue = (this.model.get('skip') === this.totalCount) ? this.totalCount : (this.model.get('skip') + 5);
			this.model.set('skip', skipValue);
			this.displayResults();
			if (this.resultsChartCollection) {
				this.loadChart(this.resultsChartCollection);
			} else {
				this.displayResultsChart();
			}
		},
		movePrev: function(e) {
			e.preventDefault();
			var skipValue = (this.model.get('skip') === 0) ? 0 : (this.model.get('skip') - 5);
			this.model.set('skip', skipValue);
			this.displayResults();
			if (this.resultsChartCollection) {
				this.loadChart(this.resultsChartCollection);
			} else {
				this.displayResultsChart();
			}
		},

		setDateRange: function(e) {
			if (e.target.id == "toDate") {
				this.dateRange[1] = parseInt($(e.target).val());
			}
			if (e.target.id == "fromDate") {
				this.dateRange[0] = parseInt($(e.target).val());
			}
		},
		setModelDataAndNavigate: function() {
			var data = {
				'searchTerms': (this.searchTerms) ? (_.isArray(this.searchTerms) ? this.searchTerms.join(',') : this.searchTerms) : '',
				'distributionPattern': (this.stateList) ? (_.isArray(this.stateList) ? this.stateList.join(',') : this.stateList) : '',
				'recallStatus': (this.recallStatuses) ? (_.isArray(this.recallStatuses) ? this.recallStatuses.join(',') : this.recallStatuses) : '',
				'skip': this.model.get('skip'),
				'dateRange': this.dateRange
			};
			this.model.clearModel();
			this.model.set(data);
			if (this.searchTerms)
				this.displayResults();

		}
	});

	// Returns the View class
	return MainView;
});