import { join as urlJoin } from "jsr:@std/path/join";

export interface DeploymentClientOptions {
  endpoint?: string;
}
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

interface DeploymentConfig {
  /**
   * An URL of the entry point of the application.
   * This is the file that will be executed when the deployment is invoked.
   */
  entryPointUrl: string;

  /**
   * An URL of the import map file. If null, import map auto-discovery is performed.
   */
  importMapUrl?: string | null;

  /**
   * An URL of the lock file. If null, lock file auto-discovery is performed.
   */
  lockFileUrl?: string | null;

  compilerOptions?: null | {
    /**
     * Whether to enable TypeScript's experimental decorators.
     * If omitted, this defaults to false.
     */
    experimentalDecorators?: boolean | null;

    /**
     * Whether to emit metadata when using experimental decorators.
     * Only effective if `experimentalDecorators` is true.
     * Defaults to false if omitted.
     */
    emitDecoratorMetadata?: boolean | null;

    jsx?: string | null;
    jsxFactory?: string | null;
    jsxFragmentFactory?: string | null;
    jsxImportSource?: string | null;
    jsxPrecompileSkipElements?: string[];
  };

  /**
   * A map whose key represents a file path, and the value is an asset.
   */
  assets: Record<string, {
    kind: "file" | "symlink";
    content?: string;
    encoding?: "utf-8" | "base64";
    gitSha1?: string;
    target?: string;
  }>;

  /**
   * A list of domains that will be attached to the deployment.
   */
  domains?: string[];

  /**
   * A dictionary of environment variables to be set in the runtime environment.
   */
  envVars: Record<string, string>;

  /**
   * KV database ID mappings to associate with the deployment.
   * Currently, only the "default" database is supported.
   */
  databases?: Record<string, string> | null;

  /**
   * The wall-clock timeout in milliseconds for requests to the deployment.
   */
  requestTimeout?: number | null;

  permissions?: null | {
    /**
     * A list of IP addresses or hostnames allowed for outbound network requests.
     * If omitted, all accesses are allowed.
     */
    net?: string[];
  };

  /**
   * A description of the created deployment. Max length: 1000 chars.
   */
  description?: string | null;
}
interface Deployment {
  id: string; // A deployment ID (not UUID v4)
  projectId: string; // UUID
  description?: string | null; // Present only when status is 'success'
  status: "failed" | "pending" | "success"; // Enum for deployment status
  domains?: string[]; // Optional array of domain strings
  databases: Record<string, string>; // KV databases, only "default" supported
  requestTimeout?: number | null; // Wall-clock timeout in milliseconds
  permissions?: null | {
    net: string[]; // List of allowed IPs/hostnames for outbound requests
  };
  createdAt: string; // ISO date-time string
  updatedAt: string; // ISO date-time string
}

export default class DeploymentClient {
  accessToken: string;
  orgId: string;
  clientOptions: DeploymentClientOptions;

  constructor(
    accessToken?: string,
    orgId?: string,
    options?: DeploymentClientOptions,
  ) {
    const at = accessToken ?? Deno.env.get("DEPLOY_ACCESS_TOKEN");
    if (!at) {
      throw new Error(
        "A Deno Deploy access token is required (or set DEPLOY_ACCESS_TOKEN env variable).",
      );
    }

    const org = orgId ?? Deno.env.get("DEPLOY_ORG_ID");
    if (!org) {
      throw new Error(
        "Deno Subhosting org ID is required (or set DEPLOY_ORG_ID env variable).",
      );
    }

    this.accessToken = at;
    this.orgId = org;
    this.clientOptions = Object.assign({
      endpoint: "https://api.deno.com/v1",
    }, options);
  }
  get orgUrl() {
    return `/organizations/${this.orgId}`;
  }
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const finalUrl = urlJoin(this.clientOptions.endpoint!, url);
    const finalHeaders = Object.assign({
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    }, options?.headers || {});
    const finalOptions = Object.assign({}, options, { headers: finalHeaders });

    return await fetch(finalUrl, finalOptions);
  }

  /**
   * Get a list of projects for the configured org, with optional query params
   */
  // deno-lint-ignore no-explicit-any
  async listProjects(query?: any): Promise<Response> {
    const qs = new URLSearchParams(query).toString();
    return await this.fetch(`${this.orgUrl}/projects?${qs}`, { method: "GET" });
  }

  /**
   * Create a project within the configured organization for the client.
   */
  async createProject(name?: string): Promise<Project> {
    const response = await this.fetch(`${this.orgUrl}/projects`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return response.json();
  }

  /**
   * Get a list of deployments for the given project, with optional query params.
   */
  // deno-lint-ignore no-explicit-any
  async listDeployments(projectId: string, query?: any): Promise<Response> {
    const qs = new URLSearchParams(query).toString();
    return await this.fetch(`/projects/${projectId}/deployments?${qs}`, {
      method: "GET",
    });
  }

  /**
   * Get a list of logs for the given deployment, with optional query params
   */
  // deno-lint-ignore no-explicit-any
  async listAppLogs(deploymentId: string, query?: any): Promise<Response> {
    const qs = new URLSearchParams(query).toString();
    return await this.fetch(`/deployments/${deploymentId}/app_logs?${qs}`, {
      method: "GET",
    });
  }

  /**
   * Create a new deployment for the given project by ID.
   */
  async createDeployment(
    projectId: string,
    deploymentOptions: DeploymentConfig,
  ): Promise<Deployment> {
    const response = await this.fetch(`/projects/${projectId}/deployments`, {
      method: "POST",
      body: JSON.stringify(deploymentOptions),
    });
    return await response.json();
  }
}
