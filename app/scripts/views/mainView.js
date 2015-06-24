// MainView.js
// ----------
define([
	'jquery', 'backbone', 'text!templates/main.html', 'text!locale/main.json', 'text!locale/es_mx/main.json',
	'text!templates/dateRangeTemplate.html', 'text!templates/distributionPattern.html', 'text!templates/stateTemplate.html',
	'text!templates/recallStatusTemplate.html', 'text!templates/foodPyramidTemplate.html', 'text!templates/foodPathogenTemplate.html',
	'text!templates/resultsSubTemplate.html', 'text!templates/detailsTemplate.html', 'collections/itemCollection',
	'collections/recalledFoodCollection', 'd3', 'c3', 'helpers/uStates', 'collections/termsCollection',
], function($, Backbone, template, content, contentES, DateRangeTemplate, DistributionPatternTemplate, StateTemplate, RecallStatusTemplate,
	FoodPyramidTemplate, FoodPathogenTemplate, ResultsSubTemplate, DetailsTemplate, ItemCollection, RecalledFoodCollection,
	d3, c3, uStates, TermsCollection) {
	'use strict';

	// Creates a new Backbone View class object
	var MainView = Backbone.View.extend({

		// The Model associated with this view
		model: '',

		searchTerms: '',

		recallStatuses: '',

		stateList: '',

		dateRange: [2012, 2015],

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
			'change #fromDate, #toDate': 'setDateRange'
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

			//loading the food pyramid and food Pathogen section
			this.foodPyramidTemplate = _.template(FoodPyramidTemplate, {});
			this.$el.find('#foodInfo').html(this.foodPyramidTemplate);

			this.foodPathogenTemplate = _.template(FoodPathogenTemplate, {});
			this.$el.find('#foodPathogens').html(this.FoodPathogenTemplate);
			//load the advanced search items
			this.loadAdvancedSearch();

			var self = this;
			this.$el.find('#select-fooditem').selectize({
				maxItems: 3,
				plugins: ['remove_button'],
				delimiter: ',',
				persist: false,
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

			this.model.set({'searchTerms': this.model.get('searchTerms').replace(',', ' ')});
			this.termsCollection = new TermsCollection();
			this.termsCollection.url = this.model.generateCountURL(); //window.gblResults + 'search=reason_for_recall:' + this.model.attributes.searchTerms + '&count=classification.exact';


			var self = this;
			this.$el.find('#results').html('');

			this.recalledFoodCollection.fetch({
				success: function() {
					self.totalCount = self.recalledFoodCollection.totalCount;
					self.loadTemplate();

					self.termsCollection.fetch({
						success: function() {

							var chart = c3.generate({
								bindto: '#chart',
								data: {
									columns: [
										[$.trim(self.termsCollection.at(0).attributes.name).toLowerCase().replace(' ', ''), self.termsCollection.at(0).attributes.count, 'black'],
										[$.trim(self.termsCollection.at(1).attributes.name).toLowerCase().replace(' ', ''), self.termsCollection.at(1).attributes.count, 'white'],
										[$.trim(self.termsCollection.at(2).attributes.name).toLowerCase().replace(' ', ''), self.termsCollection.at(2).attributes.count, 'blue'],
									],
									type: 'donut'
								},
								donut: {
									title: "Recall Classification"
								}
							});

							chart.data.colors({						
								
								classi: '#d595a0',
								classii: '#F89C2D',
								classiii: '#F5D60A'
							});

						}
					});
				},
				error: function() {
					self.totalCount = 0;
					self.loadTemplate();
				}
			});

		},
		loadAdvancedSearch: function() {
			this.$el.find('#dateRangeSection').html(this.dateRangeTemplate);
			this.$el.find('#stateSection').html(this.stateTemplate);
			this.$el.find('#recallStatusSection').html(this.recallStatusTemplate);
		},
		//load the respective templates
		loadTemplate: function() {

			this.subTemplate = _.template(ResultsSubTemplate, {
				content: JSON.parse(content),
				data: this.recalledFoodCollection.toJSON(),
				reqModel: this.model,
				maxCount: this.totalCount
			});

			this.$el.find('#results').html(this.subTemplate);


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

			this.$el.find('#details').html(this.detailsTemplate);

			/////////////////////////////////////for classiiiclassiii: '#F5D60A'
			var mapColor = '#d5d5d5';
			if ($.trim(recallDetails[0].attributes.classification).toLowerCase() === 'class i') {
				mapColor = '#d595a0';
			} else if ($.trim(recallDetails[0].attributes.classification).toLowerCase() === 'class ii') {
				mapColor = '#F89C2D';
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

			document.getElementById('details').scrollIntoView(true)
			window.scrollBy(0, -75);
		},

		tooltipHtml: function(n, d) { /* function to create html content string in tooltip div. */
			return "<h4>" + n + "</h4><table>" +
				"<tr><td>Low</td><td>" + (d.low) + "</td></tr>" +
				"<tr><td>Average</td><td>" + (d.avg) + "</td></tr>" +
				"<tr><td>High</td><td>" + (d.high) + "</td></tr>" +
				"</table>";
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
		},
		movePrev: function(e) {
			e.preventDefault();
			var skipValue = (this.model.get('skip') === 0) ? 0 : (this.model.get('skip') - 5);
			this.model.set('skip', skipValue);
			this.displayResults();
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
			this.displayResults();
		}
	});

	// Returns the View class
	return MainView;
});