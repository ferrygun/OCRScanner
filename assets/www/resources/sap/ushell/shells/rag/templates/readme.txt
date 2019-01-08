Templates for an FLP package that can be deployed to the Runtime Agent

There are 2 kind of template variables:

Substitution at packaging or deployment time
(use $ notation like environment variables):

The following predefined properties exist:
  -  $ui5ResourceRoot: root path for SAPUI5 resources; needs to be replaced
         by the platform-specific location including a cache-buster token (at deployment time)
         or by an absolute URL pointing to the SAPUI5 CDN (at packaging time)
  -  $sapClient: the client of the ABAP system; needs to be replaced at deployment time
  -  $sapSystemId: the SID of the ABAP system; needs to be replaced at deployment time
  -  $logoutUrl: the default URL for logout; needs to be replaced at deployment time;
         (default on ABAP: "/sap/public/bc/icf/logoff")
         might be overridden by a custom logout URL defined in FLP settings
  - '$localeUnderscore': the locale in underscore notation; needs to be replaced at
         packaging time if the site template is used

Substitution at runtime:

include directives according to Runtime Agent Specification,
e.g. {{include "./request/env/localeUnderscore.txt"}}