import { join as urlJoin } from "jsr:@std/path/join";

export interface DeploymentClientOptions {
  endpoint?: string;
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
  async createProject(name?: string): Promise<Response> {
    return await this.fetch(`${this.orgUrl}/projects`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
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
    // deno-lint-ignore no-explicit-any
    deploymentOptions: any,
  ): Promise<Response> {
    return await this.fetch(`/projects/${projectId}/deployments`, {
      method: "POST",
      body: JSON.stringify(deploymentOptions),
    });
  }
}
