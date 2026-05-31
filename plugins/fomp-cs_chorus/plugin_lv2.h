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

#include "ladspaplugin.h"

extern "C" {

static void
connect_port(LV2_Handle instance,
             uint32_t   port,
             void*      data)
{
	((LadspaPlugin*)instance)->setport(port, data);
}

static void
activate(LV2_Handle instance)
{
    ((LadspaPlugin*)instance)->active(true);
}

static void
run(LV2_Handle instance, uint32_t n_samples)
{
    ((LadspaPlugin*)instance)->runproc(n_samples, false);
}

static void
deactivate(LV2_Handle instance)
{
    ((LadspaPlugin*)instance)->active(false);
}

static void
cleanup(LV2_Handle instance)
{
	delete ((LadspaPlugin*)instance);
}

}  // extern "C"
