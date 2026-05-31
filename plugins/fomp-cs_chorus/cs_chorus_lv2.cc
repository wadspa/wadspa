/*
  Copyright (C) 2012 David Robillard <d@drobilla.net>
    
  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/

#include <stddef.h>

#include "cs_chorus.h"
#include "plugin_lv2.h"

extern "C" {

static LV2_Handle
instantiate1(const LV2_Descriptor*     descriptor,
             double                    rate,
             const char*               bundle_path,
             const LV2_Feature* const* features)
{
	return new Ladspa_CS_chorus1(rate);
}

static LV2_Handle
instantiate2(const LV2_Descriptor*     descriptor,
             double                    rate,
             const char*               bundle_path,
             const LV2_Feature* const* features)
{
	return new Ladspa_CS_chorus2(rate);
}

static LV2_Handle
instantiate3(const LV2_Descriptor*     descriptor,
             double                    rate,
             const char*               bundle_path,
             const LV2_Feature* const* features)
{
	return new Ladspa_CS_chorus3(rate);
}

static const LV2_Descriptor descriptors[3] = {
	{ "http://drobilla.net/plugins/fomp/cs_chorus1",
	  instantiate1,
	  connect_port,
	  activate,
	  run,
	  deactivate,
	  cleanup,
	  NULL },
	{ "http://drobilla.net/plugins/fomp/cs_chorus2",
	  instantiate2,
	  connect_port,
	  activate,
	  run,
	  deactivate,
	  cleanup,
	  NULL },
	{ "http://drobilla.net/plugins/fomp/triple_chorus",
	  instantiate3,
	  connect_port,
	  activate,
	  run,
	  deactivate,
	  cleanup,
	  NULL },
};

LV2_SYMBOL_EXPORT
const LV2_Descriptor*
lv2_descriptor(uint32_t index)
{
	if (index < 3) {
		return &descriptors[index];
	}
	return NULL;
}

}  // extern "C"
