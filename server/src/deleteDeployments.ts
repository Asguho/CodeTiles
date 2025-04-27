import DeploymentClient from "./DeploymentClient.ts";

const deploymentClient = new DeploymentClient();

const projects = await deploymentClient.listProjects();
console.log("Projects:", projects);

for (const project of projects) {
  const deployments = await deploymentClient.listDeployments(project.id);
  console.log(`Project: ${project.name}, Deployments:`, deployments);
  await Promise.all(deployments.map(async (deployment) => {
    const resp = await deploymentClient.deleteDeployment(deployment.id);
    console.log(`Deleted deployment: ${deployment.id}, Response:`, resp);
  }));
  await Promise.all(projects.map(async (project) => {
    const resp = await deploymentClient.deleteProject(project.id);
    console.log(`Deleted project: ${project.id}, Response:`, await resp.text());
  }));
}
