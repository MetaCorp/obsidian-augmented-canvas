import {
    CanvasFileNode,
    CanvasGroupNode,
    CanvasLinkNode,
    CanvasNode,
    CanvasTextNode,
    Component,
    setIcon
} from "obsidian";
import { HeaderComponent } from "./types/custom";
import { CanvasData, CanvasNodeData } from "obsidian/canvas";

export default class CollapseControlHeader extends Component implements HeaderComponent {
    private collapsed: boolean = false;
    private collapsedIconEl: HTMLDivElement;
    private typeIconEl: HTMLDivElement;
    private titleEl: HTMLSpanElement;
    private headerEl: HTMLElement;

    private content: string = "";
    private node: CanvasNode;


    private refreshed: boolean = false;
    private containingNodes: any[] = [];

    constructor(node: CanvasNode) {
        super();

        this.node = node;
        this.collapsed = node.unknownData.collapsed === undefined ? false : node.unknownData.collapsed;
    }

    onload() {
        this.initHeader();
        this.initContent();
        this.initTypeIcon();
        this.updateNodesInGroup();
        this.updateNode();

        return this.headerEl;
    }

    onunload() {
        super.onunload();
        this.headerEl.empty();
        this.headerEl.detach();
    }

    initHeader() {
        this.headerEl = createEl("div", {
            cls: "canvas-node-collapse-control"
        })
        this.registerDomEvent(this.headerEl, "click", async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            await this.toggleCollapsed();
        });

        this.collapsedIconEl = this.headerEl.createEl("div", {
            cls: "canvas-node-collapse-control-icon"
        });

        this.typeIconEl = this.headerEl.createEl("div", {
            cls: "canvas-node-type-icon"
        });

        this.titleEl = this.headerEl.createEl("span", {
            cls: "canvas-node-collapse-control-title"
        });
    }

    checkNodeType() {
        return this.node.unknownData.type;
    }

    initTypeIcon() {
        this.setIconOrContent("setIcon");
    }

    initContent() {
        this.setIconOrContent("setContent");
        this.titleEl.setText(this.content);
    }

    setIconOrContent(action: "setIcon" | "setContent") {
        const currentType = this.checkNodeType();
        switch (currentType) {
            case "text":
                if (action === "setIcon") setIcon(this.typeIconEl, "sticky-note");
                if (action === "setContent") this.content = (this.node as CanvasTextNode).text.slice(0, 10) + ((this.node as CanvasTextNode).text.length > 10 ? "..." : "");
                break;
            case "file":
                if (action === "setIcon") {
                    if ((this.node as CanvasFileNode).file.name.split(".")[1].trim() === "md") setIcon(this.typeIconEl, "file-text");
                    else setIcon(this.typeIconEl, "file-image");
                }
                if (action === "setContent") this.content = (this.node as CanvasFileNode).file?.name.split(".")[0];
                break;
            case "group":
                if (action === "setIcon") setIcon(this.typeIconEl, "create-group");
                if (action === "setContent") this.content = "";
                break;
            case "link":
                if (action === "setIcon") setIcon(this.typeIconEl, "link");
                if (action === "setContent") this.content = (this.node as CanvasLinkNode).url;
                break;
        }

        if (action === "setIcon" && !this.node.unknownData.type) {
            setIcon(this.typeIconEl, "sticky-note");
        }
    }


    setCollapsed(collapsed: boolean) {
        if (this.node.canvas.readonly) return;
        if (this.collapsed === collapsed) return;

        this.collapsed = collapsed;
        this.node.unknownData.collapsed = collapsed;

        this.updateNodesInGroup();
        this.updateNode();
        this.updateEdges();
    }

    refreshHistory() {
        if (this.refreshed) return;

        const history = this.node.canvas.history;
        if (!history || history.data.length === 0) return;

        history.data.forEach((data: CanvasData) => {
            data.nodes.forEach((node: CanvasNodeData) => {
                if (node.id === this.node.id && node?.collapsed === undefined) {
                    node.collapsed = false;
                }
            })
        });
        this.refreshed = true;
    }

    async toggleCollapsed() {
        if (this.node.canvas.readonly) return;
        this.collapsed = !this.collapsed;

        this.node.unknownData.collapsed = !this.collapsed;

        this.node.canvas.requestSave(false, true);
        const canvasCurrentData = this.node.canvas.getData();
        const nodeData = canvasCurrentData.nodes.find((node: any) => node.id === this.node.id);
        if (nodeData) {
            nodeData.collapsed = this.collapsed;
            this.refreshHistory();
        }

        setTimeout(() => {
            this.node.canvas.setData(canvasCurrentData);
            this.node.canvas.requestSave(true);
        }, 0);

        this.updateNodesInGroup();
        this.updateNode();
        this.updateEdges();
    }

    updateNode() {
        this.node.nodeEl.toggleClass("collapsed", this.collapsed);
        setIcon(this.collapsedIconEl, this.collapsed ? "chevron-right" : "chevron-down");
    }

    updateEdges() {
        this.node.canvas.nodeInteractionLayer.interactionEl.detach();
        this.node.canvas.nodeInteractionLayer.render();
        const edges = this.node.canvas.getEdgesForNode(this.node);
        edges.forEach((edge: any) => {
            edge.render();
        })
    }

    updateNodesInGroup(expandAll?: boolean) {
        if (this.node.unknownData.type === "group" || (this.node as CanvasGroupNode).label) {
            const nodes = this.node.canvas.getContainingNodes(this.node.getBBox(true));

            if (expandAll) {
                this.collapsed = false;
            }

            if (this.collapsed) {
                nodes.filter((node: any) => node.id !== this.node.id).forEach((node: any) => {
                    this.containingNodes.push(node);
                    node.nodeEl.toggleClass("group-nodes-collapsed", this.collapsed);
                    this.updateEdgesInGroup(node);
                });
            } else {
                const otherGroupNodes = nodes.filter((node: any) => node.id !== this.node.id && node.unknownData.type === "group" && node.unknownData.collapsed);
                // Ignore those nodes in collapsed child group
                const ignoreNodes: any[] = [];
                for (const groupNode of otherGroupNodes) {
                    const bbox = groupNode.getBBox(true);
                    const nodesInGroup = this.node.canvas.getContainingNodes(bbox);
                    nodesInGroup.forEach((childNode: any) => {
                        if (childNode.id !== groupNode.id) {
                            ignoreNodes.push(childNode);
                        }
                    });
                }

                this.containingNodes.filter((t) => !ignoreNodes.find((k) => k.id === t.id)).forEach((node: any) => {
                    node.nodeEl.toggleClass("group-nodes-collapsed", this.collapsed);
                    this.updateEdgesInGroup(node);
                });
                ignoreNodes.forEach((node: any) => {
                    this.updateEdgesInGroup(node, node.unknownData.collapsed);
                });

                this.containingNodes = [];
            }
            this.updateEdges();
        }
    }

    updateEdgesInGroup(node: CanvasNode, triggerCollapsed?: boolean) {
        const edges = this.node.canvas.getEdgesForNode(node);
        edges.forEach((edge: any) => {
            edge.lineGroupEl.classList.toggle("group-edges-collapsed", triggerCollapsed || this.collapsed);
            edge.lineEndGroupEl?.classList.toggle("group-edges-collapsed", triggerCollapsed || this.collapsed);
            edge.lineStartGroupEl?.classList.toggle("group-edges-collapsed", triggerCollapsed || this.collapsed);
        })
    }
}
