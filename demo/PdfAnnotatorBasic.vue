<template>
    <PdfAnnotator
        title="PDF ANNOTATOR"
        :layout-style="{ height: '96vh' }"
        locale="en-US"
        :default-show-annotations-sidebar="true"
        :url="pdfUrl"
        :user="{ id: 'u1', name: 'Alice' }"
        :initial-annotations="initialAnnotations"
        @save="(a) => console.log('Saved:', a)"
        @load="() => console.log('🎉 PDF Loaded')"
        @annotation-added="(a) => console.log('➕', a)"
        @annotation-deleted="(id) => console.log('➖', id)"
        @annotation-updated="(a) => console.log('✏️', (a as any).id)"
    />
</template>

<script setup lang="ts">
import PdfAnnotator from '@/PdfAnnotator.vue'
const pdfUrl = new URL('./compressed.tracemonkey-pldi-09.pdf', import.meta.url).href
const initialAnnotations: Annotation[] = [
    {
        "id": "hoASnRwPlmSVK707p0pyM",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 80.53125000000001,
                            "y": 73.49062500000001
                        },
                        "p2": {
                            "x": 274.4880615234375,
                            "y": 73.49062500000001
                        },
                        "p3": {
                            "x": 80.53125000000001,
                            "y": 98.69062500000001
                        },
                        "p4": {
                            "x": 274.4880615234375,
                            "y": 98.69062500000001
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "highlight",
            "color": "#b4fa56"
        },
        "appearance": {
            "strokeColor": "#b4fa56",
            "fillColor": "rgba(180, 250, 86, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622172900+08'00'",
            "updatedAt": "D:20260622172900+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"hoASnRwPlmSVK707p0pyM\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":80.53125000000001,\"y\":73.49062500000001,\"width\":193.95681152343752,\"height\":25.200000000000003,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 80.53125000000001,
                    "y": 73.49062500000001,
                    "width": 193.95681152343752,
                    "height": 25.200000000000003
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": "Trace-based Just-in-Tim"
                },
                "comments": []
            }
        }
    },
    {
        "id": "bi--7Y9SaxdyPadDWSaGY",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 266.15625,
                            "y": 189.32500000000002
                        },
                        "p2": {
                            "x": 343.2562500000001,
                            "y": 189.32500000000002
                        },
                        "p3": {
                            "x": 266.15625,
                            "y": 190.82500000000002
                        },
                        "p4": {
                            "x": 343.2562500000001,
                            "y": 190.82500000000002
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "underline",
            "color": "#1272e8"
        },
        "appearance": {
            "strokeColor": "#1272e8",
            "fillColor": "rgba(18, 114, 232, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622172906+08'00'",
            "updatedAt": "D:20260622172906+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"bi--7Y9SaxdyPadDWSaGY\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":266.15625,\"y\":189.32500000000002,\"width\":77.10000000000008,\"fill\":\"#1272e8\",\"hitStrokeWidth\":10,\"height\":1.5},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 266.15625,
                    "y": 189.32500000000002,
                    "width": 77.10000000000008,
                    "height": 1.5
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Underline"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": "Mozilla Corporation∗"
                },
                "comments": []
            }
        }
    },
    {
        "id": "0QlMk90XDc21L-MU-19tf",
        "kind": "stamp",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 429.6000000000001,
                    "y": 264.986387434555,
                    "width": 120.00000000000006,
                    "height": 62.82722513089004
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "stamp",
            "name": "Alice",
            "label": "Alice",
            "source": "custom"
        },
        "appearance": {
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622172944+08'00'",
            "updatedAt": "D:20260622172944+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"0QlMk90XDc21L-MU-19tf\",\"x\":16.199999999999996,\"y\":22.2},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":413.4000000000001,\"y\":242.78638743455502,\"width\":120,\"height\":62.82722513089005,\"base64\":\"data:image/png;base64,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\"},\"className\":\"Image\"}]}",
                "clientRect": {
                    "x": 429.6000000000001,
                    "y": 264.986387434555,
                    "width": 120.00000000000006,
                    "height": 62.82722513089004
                }
            },
            "pdfjs": {
                "type": "STAMP",
                "subtype": "Stamp"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": "",
                    "image": "data:image/png;base64,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"
                },
                "comments": [
                    {
                        "id": "FPiuFu3OmO9dobqzHl9LV",
                        "title": "Alice",
                        "date": "D:20260622172953+08'00'",
                        "content": "yes!"
                    }
                ]
            }
        }
    },
    {
        "id": "t5AnxkKZJAO4l_98XrFzN",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 44.000000000000014,
                    "y": 326.00000000000006,
                    "width": 61.400000000000006,
                    "height": 28.399999999999977
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "rect"
        },
        "appearance": {
            "strokeColor": "#e64980",
            "fillColor": "rgba(230, 73, 128, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622173014+08'00'",
            "updatedAt": "D:20260622173014+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"t5AnxkKZJAO4l_98XrFzN\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"radiusX\":29.700000000000006,\"radiusY\":13.199999999999989,\"x\":74.70000000000002,\"y\":340.20000000000005,\"strokeScaleEnabled\":false,\"stroke\":\"#e64980\"},\"className\":\"Ellipse\"}]}",
                "clientRect": {
                    "x": 44.000000000000014,
                    "y": 326.00000000000006,
                    "width": 61.400000000000006,
                    "height": 28.399999999999977
                }
            },
            "pdfjs": {
                "type": "SQUARE",
                "subtype": "Square"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": ""
                },
                "comments": []
            }
        }
    }
] as Annotation[]
</script>
