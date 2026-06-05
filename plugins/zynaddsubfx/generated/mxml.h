#ifndef MXML_H
#define MXML_H
#ifdef __cplusplus
extern "C" {
#endif
#define MXML_MAJOR_VERSION 4
typedef struct _mxml_node_s mxml_node_t;
typedef struct _mxml_options_s mxml_options_t;
typedef struct _mxml_index_s mxml_index_t;
typedef int mxml_type_t;
typedef int mxml_sax_event_t;
typedef const char *(*mxml_load_cb_t)(mxml_node_t *);
typedef int (*mxml_save_cb_t)(mxml_node_t *, const char *);
typedef void (*mxml_sax_cb_t)(mxml_node_t *, mxml_sax_event_t, void *);
#define MXML_DESCEND 1
#define MXML_DESCEND_FIRST 2
#define MXML_NO_DESCEND 0
#define MXML_OPAQUE 1
#define MXML_TEXT 2
#define MXML_INTEGER 3
#define MXML_REAL 4
#define MXML_ELEMENT 5
#ifdef __cplusplus
}
#endif
#endif
