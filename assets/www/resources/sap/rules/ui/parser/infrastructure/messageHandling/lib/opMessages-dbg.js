jQuery.sap.declare("sap.rules.ui.parser.infrastructure.messageHandling.lib.opMessages");

sap.rules.ui.parser.infrastructure.messageHandling.lib.opMessages = sap.rules.ui.parser.infrastructure.messageHandling.lib.opMessages|| {}; 
sap.rules.ui.parser.infrastructure.messageHandling.lib.opMessages.lib = (
	function() {
		var consts = { 
			opMessages: {
				"validate": {
					"success": {
						"code": "1000"
					},
					"failure": {
						"code": "1001"
					}
				},
				"resource_CRUD": {
					"success": {
						"code": "2000"
					},
					"failure": {
						"code": "2001"
					}
				},
				"get_params": {
					"success": {
						"code": "3000"
					},
					"failure": {
						"code": "3001"
					}
				},
				"rule_service_consumption": {
					"success": {
						"code": "4000"
					},
					"failure": {
						"code": "4001"
					}
				},
				"complete_activation": {
					"success": {
						"code": "5000"
					},
					"failure": {
						"code": "5001"
					}
				},
				"activation": {
					"success": {
						"code": "6000"
					},
					"failure": {
						"code": "6001"
					}
				},
				"post_activation": {
					"success": {
						"code": "7000"
					},
					"failure": {
						"code": "7001"
					}
				},
				"runtime_services": {
					"success": {
						"code": "8000"
					},
					"failure": {
						"code": "8001"
					}
				},
				"create_service_dispatcher": {
					"success": {
						"code": "9000"
					},
					"failure": {
						"code": "9001"
					}
				},
				"hrf_technical_configuration": {
					"success": {
						"code": "10000"
					},
					"failure": {
						"code": "10001"
					}
				},
				"compilation": {
					"success": {
						"code": "11000"
					},
					"failure": {
						"code": "11001"
					}
				},
				"RuleValidation": {
					"success": {
						"code": "12000"
					},
					"failure": {
						"code": "12001"
					}
				},
				"RuleServiceValidation": {
					"success": {
						"code": "13000"
					},
					"failure": {
						"code": "13001"
					}
				}
			}
		};
		return consts;
	}());