"use client"

import { useEffect, useMemo, useState } from "react"
import { 
  FolderTree, 
  Plus, 
  Edit2, 
  GitMerge, 
  Save, 
  FolderPlus, 
  Settings, 
  HelpCircle, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2
} from "lucide-react"
import { getCategories } from "@/features/listings/actions"
import { 
  createCategoryByAdmin, 
  updateCategoryByAdmin, 
  mergeCategoriesByAdmin 
} from "@/features/admin/actions"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  slug: string
  name: string
  parent_id: string | null
  icon_name: string | null
  attribute_schema: any
  is_active: boolean
}

interface VisualAttribute {
  key: string
  label: string
  type: "select"
  optionsString: string
}

export default function AdminCategoriesPage() {
  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"create" | "edit" | "merge">("create")

  // Tree Navigation State
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Form State - Create / Edit Category
  const [catName, setCatName] = useState("")
  const [catSlug, setCatSlug] = useState("")
  const [catParentId, setCatParentId] = useState("none")
  const [catIconName, setCatIconName] = useState("")
  const [catIsActive, setCatIsActive] = useState(true)
  
  // Dynamic attribute schema visual builder state
  const [visualAttributes, setVisualAttributes] = useState<VisualAttribute[]>([])
  const [rawJsonSchema, setRawJsonSchema] = useState("[]")
  const [schemaMode, setSchemaMode] = useState<"visual" | "json">("visual")

  // Form State - Merge Categories
  const [mergeSourceId, setMergeSourceId] = useState("")
  const [mergeTargetId, setMergeTargetId] = useState("")
  const [isMerging, setIsMerging] = useState(false)
  const [showMergeConfirm, setShowMergeConfirm] = useState(false)

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Categories
  const fetchAllCategories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getCategories()
      if (res.error) {
        setError(res.error)
      } else if (res.categories) {
        setCategories(res.categories)
      }
    } catch (err) {
      setError("Failed to query categories.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllCategories()
  }, [])

  // Auto-slug generator
  useEffect(() => {
    if (activeTab === "create") {
      const slug = catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      setCatSlug(slug)
    }
  }, [catName, activeTab])

  // L1 Categories (Parent is null)
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id)
  }, [categories])

  // Map parent ID to subcategories
  const getSubcategories = (parentId: string) => {
    return categories.filter((c) => c.parent_id === parentId)
  }

  // Toggle tree expansion
  const toggleParent = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }))
  }

  // Sync Form when editing a category
  const startEditingCategory = (category: Category) => {
    setSelectedCategoryId(category.id)
    setCatName(category.name)
    setCatSlug(category.slug)
    setCatParentId(category.parent_id || "none")
    setCatIconName(category.icon_name || "")
    setCatIsActive(category.is_active)
    
    // Parse schema
    let schemaArray: any[] = []
    if (category.attribute_schema) {
      if (typeof category.attribute_schema === "string") {
        try {
          schemaArray = JSON.parse(category.attribute_schema)
        } catch (e) {
          schemaArray = []
        }
      } else if (Array.isArray(category.attribute_schema)) {
        schemaArray = category.attribute_schema
      }
    }

    setRawJsonSchema(JSON.stringify(schemaArray, null, 2))

    // Convert schema to visual state
    const visual = schemaArray.map((attr: any) => ({
      key: attr.key || "",
      label: attr.label || "",
      type: "select" as const,
      optionsString: Array.isArray(attr.options) ? attr.options.join(", ") : "",
    }))
    setVisualAttributes(visual)

    setActiveTab("edit")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Handle adding custom schema fields in visual builder
  const addVisualAttributeRow = () => {
    setVisualAttributes((prev) => [
      ...prev,
      { key: "", label: "", type: "select", optionsString: "" }
    ])
  }

  // Remove visual schema row
  const removeVisualAttributeRow = (index: number) => {
    setVisualAttributes((prev) => prev.filter((_, i) => i !== index))
  }

  // Update visual builder row value
  const updateVisualAttribute = (index: number, field: keyof VisualAttribute, value: string) => {
    setVisualAttributes((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      
      // Auto-generate key from label if editing label
      if (field === "label") {
        updated[index].key = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/(^-|-$)+/g, "")
      }
      
      return updated
    })
  }

  // Sync schema states based on mode changes
  useEffect(() => {
    if (schemaMode === "json") {
      // Compile visual attributes to JSON string
      const compiled = visualAttributes
        .filter((attr) => attr.label.trim())
        .map((attr) => ({
          key: attr.key.trim() || attr.label.toLowerCase().replace(/\s+/g, "_"),
          label: attr.label.trim(),
          type: attr.type,
          options: attr.optionsString.split(",").map((o) => o.trim()).filter(Boolean),
        }))
      setRawJsonSchema(JSON.stringify(compiled, null, 2))
    } else {
      // Decompile JSON string to visual attributes
      try {
        const parsed = JSON.parse(rawJsonSchema)
        if (Array.isArray(parsed)) {
          const decompiled = parsed.map((attr: any) => ({
            key: attr.key || "",
            label: attr.label || "",
            type: "select" as const,
            optionsString: Array.isArray(attr.options) ? attr.options.join(", ") : "",
          }))
          setVisualAttributes(decompiled)
        }
      } catch (e) {
        // Leave visual attributes as is if JSON is invalid
      }
    }
  }, [schemaMode])

  // Get final JSON attribute schema to submit
  const getCompiledSchemaJson = () => {
    if (schemaMode === "json") {
      return rawJsonSchema
    }
    const compiled = visualAttributes
      .filter((attr) => attr.label.trim())
      .map((attr) => ({
        key: attr.key.trim() || attr.label.toLowerCase().replace(/\s+/g, "_"),
        label: attr.label.trim(),
        type: attr.type,
        options: attr.optionsString.split(",").map((o) => o.trim()).filter(Boolean),
      }))
    return JSON.stringify(compiled)
  }

  // Reset category form
  const resetForm = () => {
    setCatName("")
    setCatSlug("")
    setCatParentId("none")
    setCatIconName("")
    setCatIsActive(true)
    setVisualAttributes([])
    setRawJsonSchema("[]")
    setSelectedCategoryId(null)
  }

  // Submit Handler
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const compiledSchema = getCompiledSchemaJson()

    try {
      if (activeTab === "create") {
        const res = await createCategoryByAdmin(
          catSlug,
          catName,
          catParentId,
          catIconName,
          compiledSchema
        )
        if (res.error) {
          setError(res.error)
        } else {
          setSuccessMessage(`Category "${catName}" created successfully.`)
          resetForm()
          fetchAllCategories()
        }
      } else if (activeTab === "edit" && selectedCategoryId) {
        const res = await updateCategoryByAdmin(
          selectedCategoryId,
          catSlug,
          catName,
          catParentId,
          catIconName,
          compiledSchema,
          catIsActive
        )
        if (res.error) {
          setError(res.error)
        } else {
          setSuccessMessage(`Category "${catName}" updated successfully.`)
          resetForm()
          setActiveTab("create")
          fetchAllCategories()
        }
      }
    } catch (err) {
      setError("An unexpected error occurred while saving.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Merge Handler
  const handleMergeCategories = async () => {
    setIsMerging(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await mergeCategoriesByAdmin(mergeSourceId, mergeTargetId)
      if (res.error) {
        setError(res.error)
      } else {
        const srcName = categories.find((c) => c.id === mergeSourceId)?.name || "Source"
        const tgtName = categories.find((c) => c.id === mergeTargetId)?.name || "Target"
        setSuccessMessage(`Successfully merged "${srcName}" into "${tgtName}". All products transferred.`)
        setMergeSourceId("")
        setMergeTargetId("")
        setShowMergeConfirm(false)
        fetchAllCategories()
      }
    } catch (err) {
      setError("An unexpected error occurred while merging.")
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start text-left font-body animate-in fade-in duration-300">
      {/* ─── LEFT: CATEGORY TREE STRUCTURE ─── */}
      <div className="w-full lg:w-5/12 bg-white border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm flex flex-col space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <FolderTree size={20} className="text-primary" />
            <h2 className="font-display text-lg font-bold text-slate-800">Categories Taxonomy</h2>
          </div>
          <button 
            onClick={fetchAllCategories}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
          </button>
        </div>

        {error && !isSubmitting && !isMerging && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-start gap-2.5">
            <Check size={16} className="shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 py-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-5 h-5 bg-slate-200 rounded"></div>
                <div className="h-5 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {parentCategories.map((parent) => {
              const subcats = getSubcategories(parent.id)
              const isExpanded = !!expandedParents[parent.id]
              const hasSubcats = subcats.length > 0

              return (
                <div key={parent.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <button
                      onClick={() => hasSubcats && toggleParent(parent.id)}
                      className="flex-1 flex items-center gap-2.5 text-left font-semibold text-sm text-slate-800"
                    >
                      {hasSubcats ? (
                        isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
                      ) : (
                        <Folder size={16} className="text-slate-300" />
                      )}
                      <span className={cn(!parent.is_active && "line-through text-slate-400")}>
                        {parent.name}
                      </span>
                      {!parent.is_active && (
                        <span className="text-[9px] font-extrabold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditingCategory(parent)}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-primary rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm shadow-transparent hover:shadow-slate-100"
                        title="Edit Super Category"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && hasSubcats && (
                    <div className="bg-white border-t border-slate-100 pl-8 pr-4 py-2 space-y-1.5">
                      {subcats.map((subcat) => (
                        <div key={subcat.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-medium text-slate-700", !subcat.is_active && "line-through text-slate-400")}>
                              {subcat.name}
                            </span>
                            {!subcat.is_active && (
                              <span className="text-[8px] font-extrabold uppercase bg-slate-100 text-slate-500 px-1 py-0.2 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => startEditingCategory(subcat)}
                            className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-primary rounded-lg transition-colors border border-transparent hover:border-slate-100"
                            title="Edit Subcategory & Schema"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── RIGHT: MANAGEMENT OPERATIONS FORMS ─── */}
      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        {/* Tabs topbar */}
        <div className="bg-white border border-outline-variant/20 rounded-2xl p-2 shadow-sm flex gap-1">
          <button
            onClick={() => {
              setActiveTab("create")
              resetForm()
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "create" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Plus size={14} />
            <span>Create New</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("edit")
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "edit" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50",
              !selectedCategoryId && "opacity-50 cursor-not-allowed"
            )}
            disabled={!selectedCategoryId}
          >
            <Settings size={14} />
            <span>Edit Selected</span>
          </button>

          <button
            onClick={() => setActiveTab("merge")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "merge" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <GitMerge size={14} />
            <span>Merge Center</span>
          </button>
        </div>

        {/* ─── TAB 1 & 2: CREATE / EDIT CATEGORY FORM ─── */}
        {(activeTab === "create" || (activeTab === "edit" && selectedCategoryId)) && (
          <form onSubmit={handleSaveCategory} className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col space-y-6">
            <h3 className="font-display text-md font-bold text-slate-800 border-b border-outline-variant/10 pb-4">
              {activeTab === "create" ? "Add New Category" : `Edit Category: ${catName}`}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-on-surface-variant/85 uppercase">Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Laptops"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-on-surface-variant/85 uppercase">Slug</label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. laptops"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-on-surface-variant/85 uppercase">Parent Category (Hierarchical level)</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat cursor-pointer"
                >
                  <option value="none">None (Create as Super/L1 Parent)</option>
                  {parentCategories
                    .filter((c) => c.id !== selectedCategoryId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-on-surface-variant/85 uppercase">Lucide Icon Name</label>
                <input
                  type="text"
                  value={catIconName}
                  onChange={(e) => setCatIconName(e.target.value)}
                  placeholder="e.g. Laptop, Bike, Shirt"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            {activeTab === "edit" && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <button
                  type="button"
                  onClick={() => setCatIsActive(!catIsActive)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-700"
                >
                  {catIsActive ? <Check size={18} className="text-emerald-600" /> : <X size={18} className="text-rose-600" />}
                </button>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Is Category Active?</span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Deactivating a category hides it from dynamic explore feeds and seller upload dropdowns.
                  </span>
                </div>
              </div>
            )}

            {/* ─── DYNAMIC PARAMETRIC SCHEMA SECTION ─── */}
            <div className="border border-outline-variant/20 rounded-3xl p-5 flex flex-col space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-800 uppercase">Parametric Schema Spec</span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Define dynamic custom specification form inputs for items in this category.
                  </span>
                </div>
                
                {/* Mode Toggles */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSchemaMode("visual")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer",
                      schemaMode === "visual" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Visual Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchemaMode("json")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer",
                      schemaMode === "json" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>

              {schemaMode === "visual" ? (
                <div className="space-y-3.5">
                  {visualAttributes.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                      <p className="text-xs text-slate-500 font-medium">No dynamic specification fields configured.</p>
                      <button
                        type="button"
                        onClick={addVisualAttributeRow}
                        className="text-[11px] font-extrabold text-primary hover:text-secondary inline-flex items-center gap-1.5"
                      >
                        <Plus size={12} /> Add First Attribute
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visualAttributes.map((attr, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                          <div className="sm:col-span-4 flex flex-col gap-1 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Label</span>
                            <input
                              type="text"
                              required
                              value={attr.label}
                              onChange={(e) => updateVisualAttribute(index, "label", e.target.value)}
                              placeholder="e.g. RAM Size"
                              className="w-full rounded-lg border border-outline-variant/30 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                            />
                          </div>

                          <div className="sm:col-span-3 flex flex-col gap-1 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-500">DB Key</span>
                            <input
                              type="text"
                              required
                              value={attr.key}
                              onChange={(e) => updateVisualAttribute(index, "key", e.target.value)}
                              placeholder="e.g. ram_size"
                              className="w-full rounded-lg border border-outline-variant/30 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                            />
                          </div>

                          <div className="sm:col-span-4 flex flex-col gap-1 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Options (Comma separated)</span>
                            <input
                              type="text"
                              required
                              value={attr.optionsString}
                              onChange={(e) => updateVisualAttribute(index, "optionsString", e.target.value)}
                              placeholder="e.g. 4GB, 8GB, 16GB"
                              className="w-full rounded-lg border border-outline-variant/30 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                            />
                          </div>

                          <div className="sm:col-span-1 pt-5 self-center flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeVisualAttributeRow(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Delete attribute row"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addVisualAttributeRow}
                        className="text-xs font-bold text-primary hover:text-secondary inline-flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Plus size={14} /> Add Another Row
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-left">
                  <textarea
                    value={rawJsonSchema}
                    onChange={(e) => setRawJsonSchema(e.target.value)}
                    rows={6}
                    placeholder="[ { 'key': 'ram', 'label': 'RAM', 'type': 'select', 'options': [...] } ]"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-xs font-mono outline-none focus:border-primary transition-all"
                  />
                  <span className="text-[9px] text-slate-500 leading-tight mt-1">
                    Must be a valid JSON array of specifications mapping key/label attributes.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-4">
              {activeTab === "edit" && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl font-body text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="action-gradient text-white px-6 py-2.5 rounded-xl font-body text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <Save size={14} />
                <span>{isSubmitting ? "Saving..." : activeTab === "create" ? "Add Category" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}

        {/* ─── TAB 3: MERGE CATEGORIES CENTER ─── */}
        {activeTab === "merge" && (
          <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col space-y-6">
            <div className="border-b border-outline-variant/10 pb-4">
              <h3 className="font-display text-md font-bold text-slate-800">
                Merger Center
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Merge all listings from an old/duplicate category into a target category, then de-activate the source node.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-rose-700 uppercase flex items-center gap-1">
                  Source Category <span className="text-[9px] bg-rose-50 border border-rose-200 px-1 py-0.2 rounded font-extrabold uppercase">To Delete</span>
                </label>
                <select
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">Select source category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                  Target Category <span className="text-[9px] bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded font-extrabold uppercase">To Keep</span>
                </label>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">Select target category...</option>
                  {categories
                    .filter((c) => c.id !== mergeSourceId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {mergeSourceId && mergeTargetId && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-left animate-in fade-in duration-200">
                <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-extrabold text-rose-900">Important Warning:</span>
                  <p className="text-rose-800 leading-normal">
                    This action will transfer all listings currently registered under **{categories.find(c => c.id === mergeSourceId)?.name}** to **{categories.find(c => c.id === mergeTargetId)?.name}** instantly. Afterwards, the source category will be set to inactive. This operation cannot be easily undone.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-outline-variant/10">
              <button
                type="button"
                disabled={!mergeSourceId || !mergeTargetId || isMerging}
                onClick={() => setShowMergeConfirm(true)}
                className="action-gradient text-white px-6 py-2.5 rounded-xl font-body text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <GitMerge size={14} />
                <span>Merge Categories</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── CONFIRM MERGE DIALOG MODAL ─── */}
      {showMergeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-outline-variant/20 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-slate-800 leading-tight">Confirm Categories Merger</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transactional database action</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-left leading-relaxed">
              Are you absolutely sure you want to merge **{categories.find(c => c.id === mergeSourceId)?.name}** into **{categories.find(c => c.id === mergeTargetId)?.name}**? This will migrate all registered student listings and deactivate the source category.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowMergeConfirm(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMerging}
                onClick={handleMergeCategories}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/10 flex items-center justify-center gap-1.5"
              >
                {isMerging ? "Merging..." : "Yes, Merge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
