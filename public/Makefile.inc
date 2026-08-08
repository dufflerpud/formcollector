#@HDR@	$Id$
#@HDR@		Copyright 2024 by
#@HDR@		Christopher Caldwell/Brightsands
#@HDR@		P.O. Box 401, Bailey Island, ME 04003
#@HDR@		All Rights Reserved
#@HDR@
#@HDR@	This software comprises unpublished confidential information
#@HDR@	of Brightsands and may not be used, copied or made available
#@HDR@	to anyone, except in accordance with the license under which
#@HDR@	it is furnished.
IAM=$(shell whoami)
PUBLIC_NAME=public
JS_NAME=Javascripts
INTERP_TFS=./interp_tfs.pl
NEW_TFS=./interp_tfs.pl.$(IAM)
JSS=$(subst .tfs,.js,$(wildcard $(PUBLIC_NAME)/*/*.tfs))
JSTESTS=$(subst .tfs,.js.$(IAM),$(wildcard $(PUBLIC_NAME)/*/*.tfs))
JSTEST_NAME=$(JS_NAME).$(IAM)
LOGOS+=$(wildcard $(PUBLIC_NAME)/*/logo.pnm)

%.js:		%.tfs $(INTERP_TFS)
		sed -e "s/%VERSION%/$(BUILD_NUM)/g" < $< | \
		    $(INTERP_TFS) -dump -js > $@
		chmod ugo+rw $@

%.js.$(IAM):	%.tfs $(NEW_TFS)
		sed -e "s/%VERSION%/$(BUILD_NUM)/g" < $< | \
		    $(NEW_TFS) -dump -js > $@
		chmod ugo+rw $@

$(JS_NAME):	$(JSS)
		@echo "[$@ built]"

$(JSTEST_NAME):$(JSTESTS)
		@echo "[$@ built]"


ALL_TARGETS += $(JS_NAME)
