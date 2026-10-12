# Fiber Atlas — owner's local app

Ready for your first import. The server app network is empty; no worker demonstration import or demo account was added. Updated 2026-10-09.

1. Open `Start Fiber Atlas.cmd` in the `fiber-prototype` folder. It opens the local app at `http://127.0.0.1:8000/`. Your internal-network connection must reach the database server.
2. If this is the first account, enter your name, email and a private password of at least 12 characters. Otherwise, use Account / Sign in in the sidebar.
3. Open **Visio Import**, choose your `.vsdx` file and process it. For a later revision, choose the existing document. Identical renamed files reuse the existing import.
4. Inspect the object/connection counts, partial journeys and source details. Unsupported formats stay staged; they cannot be added as a validated network.
5. Click **Add to network**. It applies the validated proposal atomically, then opens the map. A failed or outdated proposal preserves the previous network.
6. Use **Engineer Search** for questions about routes, Cables, Fibers, Ports, connections and organization use. Choose **ქსელში ჩვენება** to carry a result onto the map; Back returns to the same query. The top-bar search remains available for quick lookup. Open **Needs Review** for source conflicts and review items. Import the next document the same way.

The sidebar order is **Network → Engineer Search → Visio Import → Needs Review**. Engineer Search is available before the first import and explains that results appear after a Visio network is added.

Large drawings can be saved as a source inventory for review. They show **ფაილი შენახულია · ინტერპრეტაცია საჭიროა** and their page/object counts. The original file and text inventory are retained; source-specific interpretation is required before Fiber connections can be added to the network. Shida Kartli currently follows this staging workflow.

Use `Stop Fiber Atlas.cmd` to stop the local app. Original files and import history are retained. The app is local; the network records are in your named server schema.

Partial journeys stop at the last source-supported step. Source colors, usage, occupancy, allocation and availability are different facts. Historical owner-only assertions require an explicit review; the importer does not silently insert them.
