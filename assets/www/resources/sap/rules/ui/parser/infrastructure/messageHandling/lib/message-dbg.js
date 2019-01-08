jQuery.sap.declare("sap.rules.ui.parser.infrastructure.messageHandling.lib.message");

sap.rules.ui.parser.infrastructure.messageHandling.lib.message = sap.rules.ui.parser.infrastructure.messageHandling.lib.message|| {}; 
sap.rules.ui.parser.infrastructure.messageHandling.lib.message.lib = (
	function() { 
		var consts = {
			messages: {
				"resource_doesnt_exist_in_activation": {
					"code": "10",
					"severity": "error"
				},
				"suffix_isnt_handled": {
					"code": "11",
					"severity": "error"
				},
				"package_doesnt_exist": {
					"code": "12",
					"severity": "error"
				},
				"unknown_attribute": {
					"code": "13",
					"severity": "error"
				},
				"missing_mandatory_field": {
					"code": "14",
					"severity": "error"
				},
				"missing_required_fields": {
					"code": "15",
					"severity": "error"
				},
				"invalid_field": {
					"code": "16",
					"severity": "error"
				},
				"inconsistent_combination": {
					"code": "17",
					"severity": "error"
				},
				"error_retrieve_resource_id": {
					"code": "23",
					"severity": "error"
				},
				"parse_error": {
					"code": "24",
					"severity": "error"
				},
				"unsupported_http_method": {
					"code": "25",
					"severity": "error"
				},
				"techincal_error": {
					"code": "26",
					"severity": "error"
				},
				"resource_doesnt_exist": {
					"code": "27",
					"severity": "error"
				},
				"error_in_expression_message": {
					"code": "1100",
					"severity": "error"
				},
				"error_in_expression_enter_suggestions_instead_message": {
					"code": "1101",
					"severity": "error"
				},
				"error_in_expression_invalid_entry_message": {
					"code": "1102",
					"severity": "error"
				},
				"error_in_expression_invalid_token_message": {
					"code": "1103",
					"severity": "error"
				},
				"error_in_expression_single_value_missing_message": {
					"code": "1104",
					"severity": "error"
				},
				"error_in_expression_invalid_statement_message": {
					"code": "1105",
					"severity": "error"
				},
				"incomplete_expression_message": {
					"code": "1106",
					"severity": "error"
				},
				"error_in_expression_missing_token_at_the_end_of_the_expression_message": {
					"code": "1107",
					"severity": "error"
				},
				"error_in_expression_missing_token_message": {
					"code": "1108",
					"severity": "error"
				},
				"error_in_expression_missing_current_message": {
					"code": "1109",
					"severity": "error"
				},
				"error_in_expression_redundant_current_message": {
					"code": "1110",
					"severity": "error"
				},
				"invalid_root_error_message": {
					"code": "1111",
					"severity": "error"
				},
				"invalid_assoc_error_message": {
					"code": "1112",
					"severity": "error"
				},
				"invalid_assoc_or_attr_error_message": {
					"code": "1113",
					"severity": "error"
				},
				"invalid_root_data_type_error_message": {
					"code": "1114",
					"severity": "error"
				},
				"invalid_path_attr_not_found_error_message": {
					"code": "1115",
					"severity": "error"
				},
				"error_in_expression_current_not_in_where_clause_message": {
					"code": "1116",
					"severity": "error"
				},
				"error_in_expression_missing_current_in_arithmetic__message": {
					"code": "1117",
					"severity": "error"
				},
				"error_in_expression_invalid_value_from_list_message": {
					"code": "1118",
					"severity": "error"
				},
				"error_in_expression_invalid_op_for_value_list_message": {
					"code": "1119",
					"severity": "error"
				},
				"error_in_expression_invalid_current_with_all_term_message": {
					"code": "1120",
					"severity": "error"
				},
				"error_in_expression_invalid_all_with_all_term_message": {
					"code": "1121",
					"severity": "error"
				},				
				"error_in_expression_root_object_validation_message": {
					"code": "1122",
					"severity": "error"
				},
				"error_in_expression_enter_suggestions_format_instead_message": {
					"code": "1123",
					"severity": "error"
				},
				"error_in_expression_unsupported_locale_settings": {
					"code": "1124",
					"severity": "error"
				},
				"error_in_expression_invalid_value_from_external_list_message": {
					"code": "1125",
					"severity": "error"
				},
				"error_in_expression_enter_suggestions_format_instead_message_two_cases": {
					"code": "1126",
					"severity": "error"
				},
				"error_in_expression_enter_string_in_single_quotes_instead_message": { //Error in expression; enter string in single quotes: '0017' instead of 0017 
					"code": "1127",
					"severity": "error"
				},
				"error_vocabulary_invalid_expression": {
					"code": "2100",
					"severity": "error"
				},
				"error_vocabulary_problem_in_rule": {
					"code": "2101",
					"severity": "error"
				},
				"error_vocabulary_parameter_type_exist": {
					"code": "2102",
					"severity": "error"
				},
				"error_vocabulary_parameter_name_invalid": {
					"code": "2103",
					"severity": "error"
				},
				"error_vocabulary_name_invalid": {
					"code": "2104",
					"severity": "error"
				},
				"error_vocabulary_parameter_name_exists": {
					"code": "2105",
					"severity": "error"
				},
				"error_vocabulary_missing_parameter": {
					"code": "2106",
					"severity": "error"
				},

				"error_vocabulary_invalid_attribute_name": {
					"code": "2107",
					"severity": "error"
				},

				"error_object_already_exists": {
					"code": "2108",
					"severity": "error"
				},
				"error_vocabulary_attribute_already_exists": {
					"code": "2109",
					"severity": "error"
				},
				"error_vocabulary_association_already_exists": {
					"code": "2110",
					"severity": "error"
				},
				"error_vocabulary_invalid_source_table": {
					"code": "2111",
					"severity": "error"
				},
				"error_vocabulary_invalid_association": {
					"code": "2112",
					"severity": "error"
				},
				"error_vocabulary_invalid_assoc_attr": {
					"code": "2113",
					"severity": "error"
				},
				"invalid_vocabulary": {
					"code": "2114",
					"severity": "error"
				},
				"error_vocabulary_invalid_alias_content": {
					"code": "2115",
					"severity": "error"
				},
				"error_vocabulary_invalid_alias_name": {
					"code": "2116",
					"severity": "error"
				},
				"error_vocabulary_invalid_alias_name_exist_as_om": {
					"code": "2117",
					"severity": "error"
				},
				"error_vocabulary_invalid_alias_dependancy": {
					"code": "2118",
					"severity": "error"
				},
				"error_vocabulary_parameter_name_exists_in_other_voca": {
					"code": "2120",
					"severity": "error"
				},
				"error_vocabulary_scope_name_cant_be_private_or_public": {
					"code": "2121",
					"severity": "error"
				},
				"error_vocabulary_embedded_vocabulary_cant_be_with_scope_global": {
					"code": "2122",
					"severity": "error"
				},
				"error_object_does_not_exists": {
					"code": "2125",
					"severity": "error"
				},
				"error_vocabulary_object_name_cant_be_reserved_word": {
					"code": "2126",
					"severity": "error"
				},
				"error_vocabulary_alias_name_cant_be_reserved_word": {
					"code": "2127",
					"severity": "error"
				},
				"error_vocabulary_om_name_cant_be_reserved_word": {
					"code": "2128",
					"severity": "error"
				},
				"error_vocabulary_alias_name_already_exists": {
					"code": "2129",
					"severity": "error"
				},
				"error_vocabulary_alias_content_couldnt_be_empty": {
					"code": "2130",
					"severity": "error"
				},
				"error_vocabulary_alias_name_exists_as_an_attribute_name": {
					"code": "2131",
					"severity": "error"
				},
				"error_vocabulary_alias_name_exists_as_an_attribute_name_in_other_vocabulary": {
					"code": "2132",
					"severity": "error"
				},
				"error_vocabulary_alias_name_exists_as_an_attribute_name_in_global_attribute": {
					"code": "2133",
					"severity": "error"
				},
				"error_vocabulary_attribute_name_exists_as_alias_in_another_vocabulary": {
					"code": "2134",
					"severity": "error"
				},
				"error_vocabulary_depends_on_vocabulary_which_not_exists": {
					"code": "2135",
					"severity": "error"
				},
				"error_vocabulary_global_cant_have_dependencies": {
					"code": "2136",
					"severity": "error"
				},
				"error_vocabulary_association_and_attribute_cant_have_same_name": {
					"code": "2137",
					"severity": "error"
				},
				"error_vocabulary_invalid_value_list_name": {
					"code": "2138",
					"severity": "error"
				},
				"error_vocabulary_value_list_content_couldnt_be_empty": {
					"code": "2139",
					"severity": "error"
				},
				"error_vocabulary_value_list_does_not_exist": {
					"code": "2140",
					"severity": "error"
				},
				"error_vocabulary_parameter_size_invalid": {
					"code": "2141",
					"severity": "error"
				},
				"error_vocabulary_parameter_action_param_cant_be_collection": {
					"code": "2142",
					"severity": "error"
				},
				"rule_template_cant_start_with_number": {
					"code": "2300",
					"severity": "error"
				},
				"rule_template_incompitable_change": {
					"code": "2301",
					"severity": "error"
				},
				"rule_template_invalid_condition_change": {
					"code": "2302",
					"severity": "error"
				},
				"rule_template_invalid_condition": {
					"code": "2303",
					"severity": "error"
				},
				"rule_template_deletion_forbidden_rules_exist": {
					"code": "2304",
					"severity": "error"
				},
				"duplicate_rule_template_name": {
					"code": "2305",
					"severity": "error"
				},
				"rule_template_name_cant_start_with_number": {
					"code": "2306",
					"severity": "error"
				},
				"not_valid_rule_template_name_due_to_object": {
					"code": "2307",
					"severity": "error"
				},
				"not_valid_rule_template_name_due_to_alias": {
					"code": "2308",
					"severity": "error"
				},
				"additional_attr_without_rule_template": {
					"code": "2500",
					"severity": "error"
				},
				"cant_change_rule_template": {
					"code": "2501",
					"severity": "error"
				},
				"cant_change_vocabulary": {
					"code": "2502",
					"severity": "error"
				},
				"cant_change_output": {
					"code": "2503",
					"severity": "error"
				},
				"rule_template_doesnt_have_additional_attributes": {
					"code": "2504",
					"severity": "error"
				},
				"illegal_execution_context_change": {
					"code": "2505",
					"severity": "error"
				},
				"invalid_rule_template": {
					"code": "2506",
					"severity": "error"
				},
				"invalid_status_transition": {
					"code": "2507",
					"severity": "error"
				},
				"removing_embedded_service_forbidden": {
					"code": "2510",
					"severity": "error"
				},
				"removing_or_changing_embedded_service_forbidden": {
					"code": "2511",
					"severity": "error"
				},
				"embedded_service_exist_more_than_once": {
					"code": "2512",
					"severity": "error"
				},
				"invalid_rule_body": {
					"code": "2513",
					"severity": "error"
				},
				"rule_body_validator_action_ref_not_exists": {
					"code": "2514",
					"severity": "error"
				},
				"rule_body_validator_param_name_not_exists": {
					"code": "2515",
					"severity": "error"
				},
				"rule_body_validator_action_not_exists": {
					"code": "2516",
					"severity": "error"
				},
				"rule_body_validator_parameter_not_exists_in_output": {
					"code": "2517",
					"severity": "error"
				},
				"rule_body_validator_output_not_exists": {
					"code": "2518",
					"severity": "error"
				},
				"rule_body_validator_one_alias_output_param_allowed": {
					"code": "2519",
					"severity": "error"
				},
				"rule_body_validator_alias_output_params_should_have_same_type": {
					"code": "2520",
					"severity": "error"
				},
				"assigned_rule_service_does_not_exist": {
					"code": "2521",
					"severity": "error"
				},
				"assigned_rule_service_has_different_vocabualry": {
					"code": "2522",
					"severity": "error"
				},
				"assigned_rule_service_has_different_output": {
					"code": "2523",
					"severity": "error"
				},
				"assigned_rule_service_in_not_manual": {
					"code": "2524",
					"severity": "error"
				},
				"invalid_custom_condition": {
					"code": "2525",
					"severity": "error"
				},
				"rule_body_validator_one_condition_column_allowed": {
					"code": "2526",
					"severity": "error"
				},
				"rule_body_validator_alias_output_parameter_cannot_be_collection": {
					"code": "2527",
					"severity": "error"
				},
				"rule_body_validator_expressions_need_to_have_same_root_object": {
					"code": "2528",
					"severity": "error"
				},
				"result_data_object_of_the_rule_is_not_valid": {
					"code": "2529",
					"severity": "error"
				},
				"voca_is_missing_in_the_payload": {
					"code": "2530",
					"severity": "error"
				},
				"invalid_filter": {
					"code": "2700",
					"severity": "error"
				},
				"inconsistent_data_object_in_filter": {
					"code": "2701",
					"severity": "error"
				},
				"attribute_not_exist_in_data_object": {
					"code": "2704",
					"severity": "error"
				},
				"path_with_collection_not_allowed": {
					"code": "2705",
					"severity": "error"
				},
				"duplicate_data_object_mapping": {
					"code": "2706",
					"severity": "error"
				},
				"duplicate_parameter_definition": {
					"code": "2707",
					"severity": "error"
				},
				"mapped_parameter_doesnt_exist": {
					"code": "2708",
					"severity": "error"
				},
				"identifier_doesnt_exist_vocab_object": {
					"code": "2709",
					"severity": "error"
				},
				"duplicate_data_object_definition": {
					"code": "2710",
					"severity": "error"
				},
				"not_read_only_rule_service_with_result_view": {
					"code": "2711",
					"severity": "error"
				},
				"unassign_not_possible": {
					"code": "2713",
					"severity": "error"
				},
				"not_output_with_result_view": {
					"code": "2712",
					"severity": "error"
				},
				"inconsistent_output_in_event_mode": {
					"code": "2714",
					"severity": "error"
				},
				"result_data_object_of_the_rule_services_is_not_valid": {
					"code": "2715",
					"severity": "error"
				},
				"execution_context_parameter_of_the_rule_services_is_not_valid": {
					"code": "2716",
					"severity": "error"
				},
				"url_parameter_isnt_valid": {
					"code": "2955",
					"severity": "error"
				},
				"unsupported_request_mode": {
					"code": "2956",
					"severity": "error"
				},
				"metadata_is_unsupported": {
					"code": "2957",
					"severity": "error"
				},
				"metadata_is_only_supported_for_get": {
					"code": "2958",
					"severity": "error"
				},
				"opreation_denied_not_authorized": {
					"code": "100",
					"severity": "error"
				},
				"opreation_denied_not_authorized_to_update_rules": {
					"code": "101",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_delete_rules": {
					"code": "102",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_create_rules": {
					"code": "103",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_read_rules": {
					"code": "104",
					"severity": "error"
				},		
				"opreation_denied_not_authorized_to_update_rule_services": {
					"code": "105",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_delete_rule_services": {
					"code": "106",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_create_rule_services": {
					"code": "107",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_read_rule_services": {
					"code": "108",
					"severity": "error"
				},	
				"opreation_denied_not_authorized_to_run_rule_services": {
					"code": "109",
					"severity": "error"
				},	
				"opreation_denied_not_authorized_to_update_vocabularies": {
					"code": "110",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_delete_vocabularies": {
					"code": "111",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_create_vocabularies": {
					"code": "112",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_read_vocabularies": {
					"code": "113",
					"severity": "error"
				},		
				"opreation_denied_not_authorized_to_update_rule_templates": {
					"code": "114",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_delete_rule_templates": {
					"code": "115",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_create_rule_templates": {
					"code": "116",
					"severity": "error"
				},				
				"opreation_denied_not_authorized_to_read_rule_templates": {
					"code": "117",
					"severity": "error"
				},
				"opreation_denied_not_authorized_to_create_or_update_rule_services": {
					"code": "118",
					"severity": "error"
				},				
				"Technical_user_does_not_exist_or_is_not_configured_correctly": {
					"code": "119",
					"severity": "error"
				},
				"opreation_denied_not_authorized_to_call_compilation_service": {
					"code": "200",
					"severity": "error"
				},	
				
				"Error_in_query_generation_or_invalid_mapping": {
					"code": "2970",
					"severity": "error"
				},
				"parse_model_is_undefined": {
					"code": "2971",
					"severity": "error"
				},
				"invalid_combination_of_leading_object_keys_and_mapping": {
					"code": "2972",
					"severity": "error"
				},
				"Invalid_association_no_attributes": {
					"code": "2973",
					"severity": "error"
				},
				"prdective_module_procedure_not_found": {
					"code": "2974",
					"severity": "error"
				},
				"invalid_result_data": {
					"code": "2975",
					"severity": "error"
				},
				"invalid_output_name": {
					"code": "2976",
					"severity": "error"
				},
				"invalid_rule_body_type": {
					"code": "2977",
					"severity": "error"
				},
				"unsupported_method": {
					"code": "2978",
					"severity": "error"
				},
				"resource_generation_in_change_mode": {
					"code": "2979",
					"severity": "info"
				},
				"error_in_parsing_expression": {
					"code": "2980",
					"severity": "error"
				},
				"business_rule_type_should_be_text": {
					"code": "3100",
					"severity": "error"
				},
				"vocabulary_is_missing": {
					"code": "3101",
					"severity": "error"
				},
				"partial_output": {
					"code": "4100",
					"severity": "warn"
				},
				"tech_config_success": {
					"code": "10000",
					"severity": "info"
				},
				"tech_config_error": {
					"code": "10001",
					"severity": "error"
				},
				"web_app_conf_set_err": {
					"code": "10002",
					"severity": "warning"
				},
				"web_app_conf_tech_err": {
					"code": "10003",
					"severity": "error"
				},
				"time_zone_set_err": {
					"code": "10004",
					"severity": "error"
				},
				"runtime_schema_set_err": {
					"code": "10005",
					"severity": "error"
				}
				
			}
		};

		return consts;
	}());
